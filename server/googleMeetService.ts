import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { storage } from './storage';
import type { InsertGoogleMeeting, InsertGoogleToken } from '@shared/schema';

export class GoogleMeetService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback'
    );
  }

  /**
   * Generate OAuth consent URL
   */
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/meetings.space.created',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string) {
    const { tokens } = await this.oauth2Client.getAccessToken(code);
    
    if (!tokens.access_token || !tokens.expiry_date) {
      throw new Error('Invalid tokens received from Google');
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      expiresAt: new Date(tokens.expiry_date),
      scope: tokens.scope || null
    };
  }

  /**
   * Store tokens for a user
   */
  async storeUserTokens(userId: string, tokenData: InsertGoogleToken) {
    await storage.storeGoogleTokens(userId, tokenData);
  }

  /**
   * Get stored tokens for a user
   */
  async getUserTokens(userId: string) {
    return await storage.getGoogleTokens(userId);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(userId: string) {
    const tokens = await this.getUserTokens(userId);
    if (!tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.oauth2Client.setCredentials({
      refresh_token: tokens.refreshToken
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();
    
    if (!credentials.access_token || !credentials.expiry_date) {
      throw new Error('Failed to refresh access token');
    }

    // Update stored tokens
    await this.storeUserTokens(userId, {
      userId,
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token || tokens.refreshToken,
      expiresAt: new Date(credentials.expiry_date),
      scope: credentials.scope || tokens.scope
    });

    return credentials.access_token;
  }

  /**
   * Get valid access token for user (refresh if needed)
   */
  async getValidAccessToken(userId: string): Promise<string> {
    const tokens = await this.getUserTokens(userId);
    if (!tokens) {
      throw new Error('User not authenticated with Google');
    }

    // Check if token is expired (with 5 minute buffer)
    const now = new Date();
    const expiryBuffer = new Date(tokens.expiresAt.getTime() - 5 * 60 * 1000);
    
    if (now >= expiryBuffer) {
      return await this.refreshAccessToken(userId);
    }

    return tokens.accessToken;
  }

  /**
   * Create a Google Meet meeting via Calendar API
   */
  async createMeeting(userId: string, meetingData: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    attendees?: string[];
    incidentId?: number;
    systemId?: number;
  }): Promise<InsertGoogleMeeting> {
    const accessToken = await this.getValidAccessToken(userId);
    
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const event = {
      summary: meetingData.title,
      description: meetingData.description,
      start: {
        dateTime: meetingData.startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: meetingData.endTime.toISOString(),
        timeZone: 'UTC',
      },
      attendees: meetingData.attendees?.map(email => ({ email })) || [],
      conferenceData: {
        createRequest: {
          requestId: `meet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
    });

    if (!response.data.id) {
      throw new Error('Failed to create calendar event');
    }

    const meetingRecord: InsertGoogleMeeting = {
      userId,
      calendarEventId: response.data.id,
      meetingId: response.data.conferenceData?.conferenceId || null,
      title: meetingData.title,
      description: meetingData.description || null,
      startTime: meetingData.startTime,
      endTime: meetingData.endTime,
      meetLink: response.data.hangoutLink || response.data.conferenceData?.entryPoints?.[0]?.uri || null,
      status: 'scheduled',
      attendees: meetingData.attendees || [],
      incidentId: meetingData.incidentId || null,
      systemId: meetingData.systemId || null,
      metadata: {
        calendarEvent: response.data,
        conferenceData: response.data.conferenceData
      }
    };

    // Store meeting in database
    const savedMeeting = await storage.createGoogleMeeting(meetingRecord);
    
    return meetingRecord;
  }

  /**
   * Get user's upcoming meetings
   */
  async getUserMeetings(userId: string, limit: number = 10) {
    return await storage.getUserGoogleMeetings(userId, limit);
  }

  /**
   * Cancel a meeting
   */
  async cancelMeeting(userId: string, meetingId: number) {
    const meeting = await storage.getGoogleMeeting(meetingId);
    if (!meeting || meeting.userId !== userId) {
      throw new Error('Meeting not found or unauthorized');
    }

    const accessToken = await this.getValidAccessToken(userId);
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    // Cancel the calendar event
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: meeting.calendarEventId,
    });

    // Update meeting status
    await storage.updateGoogleMeeting(meetingId, { status: 'cancelled' });

    return { success: true, message: 'Meeting cancelled successfully' };
  }

  /**
   * Update a meeting
   */
  async updateMeeting(userId: string, meetingId: number, updates: {
    title?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
  }) {
    const meeting = await storage.getGoogleMeeting(meetingId);
    if (!meeting || meeting.userId !== userId) {
      throw new Error('Meeting not found or unauthorized');
    }

    const accessToken = await this.getValidAccessToken(userId);
    this.oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const updateData: any = {};
    if (updates.title) updateData.summary = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.startTime) {
      updateData.start = {
        dateTime: updates.startTime.toISOString(),
        timeZone: 'UTC',
      };
    }
    if (updates.endTime) {
      updateData.end = {
        dateTime: updates.endTime.toISOString(),
        timeZone: 'UTC',
      };
    }

    // Update the calendar event
    await calendar.events.patch({
      calendarId: 'primary',
      eventId: meeting.calendarEventId,
      resource: updateData,
    });

    // Update meeting in database
    await storage.updateGoogleMeeting(meetingId, updates);

    return { success: true, message: 'Meeting updated successfully' };
  }
}

export const googleMeetService = new GoogleMeetService();