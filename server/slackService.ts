import { WebClient } from '@slack/web-api';
import crypto from 'crypto';
import { storage } from './storage';

interface SlackWorkspaceInfo {
  teamId: string;
  teamName: string;
  accessToken: string;
  userId: string;
  scope: string;
}

interface SlackChannel {
  id: string;
  name: string;
  purpose?: string;
  topic?: string;
  isChannel: boolean;
  isMember: boolean;
  memberCount?: number;
}

interface SlackMessage {
  id: string;
  user: string;
  text: string;
  timestamp: string;
  channel: string;
  userInfo?: {
    name: string;
    realName: string;
    image: string;
  };
}

class SlackService {
  private client: WebClient | null = null;
  private workspaceInfo: SlackWorkspaceInfo | null = null;

  constructor() {
    // Initialize with environment variables if available
    if (process.env.SLACK_ACCESS_TOKEN) {
      this.client = new WebClient(process.env.SLACK_ACCESS_TOKEN);
    }
  }

  // Verify Slack request signature
  verifySlackRequest(body: string, timestamp: string, signature: string): boolean {
    try {
      const signingSecret = process.env.SLACK_SIGNING_SECRET;
      if (!signingSecret) return false;

      const time = Math.floor(new Date().getTime() / 1000);
      if (Math.abs(time - parseInt(timestamp)) > 300) {
        return false; // Request is older than 5 minutes
      }

      const sigBasestring = `v0:${timestamp}:${body}`;
      const mySignature = 'v0=' + crypto
        .createHmac('sha256', signingSecret)
        .update(sigBasestring, 'utf8')
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(mySignature),
        Buffer.from(signature)
      );
    } catch (error) {
      console.error('Error verifying Slack request:', error);
      return false;
    }
  }

  // Exchange OAuth code for access token
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<SlackWorkspaceInfo> {
    try {
      const clientId = process.env.SLACK_CLIENT_ID;
      const clientSecret = process.env.SLACK_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Slack client credentials not configured');
      }

      const response = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'OAuth exchange failed');
      }

      const workspaceInfo: SlackWorkspaceInfo = {
        teamId: data.team.id,
        teamName: data.team.name,
        accessToken: data.access_token,
        userId: data.authed_user.id,
        scope: data.scope,
      };

      // Initialize client with new token
      this.client = new WebClient(workspaceInfo.accessToken);
      this.workspaceInfo = workspaceInfo;

      return workspaceInfo;
    } catch (error) {
      console.error('Error exchanging OAuth code:', error);
      throw error;
    }
  }

  // Initialize client with stored token
  initializeWithToken(accessToken: string, workspaceInfo?: Partial<SlackWorkspaceInfo>): void {
    this.client = new WebClient(accessToken);
    if (workspaceInfo) {
      this.workspaceInfo = workspaceInfo as SlackWorkspaceInfo;
    }
  }

  // Get workspace info
  async getWorkspaceInfo(): Promise<any> {
    if (!this.client) throw new Error('Slack client not initialized');

    try {
      const [teamInfo, authTest] = await Promise.all([
        this.client.team.info(),
        this.client.auth.test(),
      ]);

      return {
        team: teamInfo.team,
        user: authTest,
      };
    } catch (error) {
      console.error('Error fetching workspace info:', error);
      throw error;
    }
  }

  // Get channels list
  async getChannels(): Promise<SlackChannel[]> {
    if (!this.client) throw new Error('Slack client not initialized');

    try {
      const result = await this.client.conversations.list({
        types: 'public_channel,private_channel',
        exclude_archived: true,
        limit: 100,
      });

      if (!result.channels) return [];

      const channels: SlackChannel[] = result.channels.map((channel: any) => ({
        id: channel.id,
        name: channel.name || 'Unknown',
        purpose: channel.purpose?.value || '',
        topic: channel.topic?.value || '',
        isChannel: true,
        isMember: channel.is_member || false,
        memberCount: channel.num_members || 0,
      }));

      return channels;
    } catch (error) {
      console.error('Error fetching channels:', error);
      throw error;
    }
  }

  // Get channel messages
  async getChannelMessages(channelId: string, limit: number = 20): Promise<SlackMessage[]> {
    if (!this.client) throw new Error('Slack client not initialized');

    try {
      const result = await this.client.conversations.history({
        channel: channelId,
        limit,
      });

      if (!result.messages) return [];

      // Get user info for each unique user in messages
      const userIds = [...new Set(result.messages.map((msg: any) => msg.user).filter(Boolean))];
      const userInfoPromises = userIds.map(userId => 
        this.client!.users.info({ user: userId }).catch(() => null)
      );
      const userInfoResults = await Promise.all(userInfoPromises);
      
      const userInfoMap = new Map();
      userInfoResults.forEach((result, index) => {
        if (result?.user) {
          userInfoMap.set(userIds[index], {
            name: result.user.name,
            realName: result.user.real_name || result.user.name,
            image: result.user.profile?.image_72 || '',
          });
        }
      });

      const messages: SlackMessage[] = result.messages.map((msg: any) => ({
        id: msg.ts,
        user: msg.user || 'Unknown',
        text: msg.text || '',
        timestamp: new Date(parseFloat(msg.ts) * 1000).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        channel: channelId,
        userInfo: userInfoMap.get(msg.user),
      }));

      return messages.reverse(); // Show newest messages last
    } catch (error) {
      console.error('Error fetching channel messages:', error);
      throw error;
    }
  }

  // Send message to channel
  async sendMessage(channelId: string, text: string): Promise<any> {
    if (!this.client) throw new Error('Slack client not initialized');

    try {
      const result = await this.client.chat.postMessage({
        channel: channelId,
        text,
      });

      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Send incident notification
  async sendIncidentNotification(channelId: string, incident: any): Promise<any> {
    if (!this.client) throw new Error('Slack client not initialized');

    const severityColor = {
      'critical': '#ff0000',
      'high': '#ff6600',
      'medium': '#ffcc00',
      'low': '#00cc00',
    }[incident.severity] || '#cccccc';

    try {
      const result = await this.client.chat.postMessage({
        channel: channelId,
        text: `🚨 Incident Alert: ${incident.title}`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `🚨 ${incident.title}`,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Severity:* ${incident.severity.toUpperCase()}`,
              },
              {
                type: 'mrkdwn',
                text: `*Status:* ${incident.status}`,
              },
              {
                type: 'mrkdwn',
                text: `*Affected System:* ${incident.systemName || 'Unknown'}`,
              },
              {
                type: 'mrkdwn',
                text: `*Created:* ${new Date(incident.createdAt).toLocaleString()}`,
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Description:* ${incident.description || 'No description available'}`,
            },
          },
          {
            type: 'divider',
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `QueryLinker Incident ID: ${incident.id}`,
              },
            ],
          },
        ],
      });

      return result;
    } catch (error) {
      console.error('Error sending incident notification:', error);
      throw error;
    }
  }

  // Get direct messages (conversations with users)
  async getDirectMessages(): Promise<any[]> {
    if (!this.client) throw new Error('Slack client not initialized');

    try {
      const result = await this.client.conversations.list({
        types: 'im',
        exclude_archived: true,
        limit: 50,
      });

      if (!result.channels) return [];

      const dmPromises = result.channels.map(async (dm: any) => {
        try {
          const userInfo = await this.client!.users.info({ user: dm.user });
          const history = await this.client!.conversations.history({
            channel: dm.id,
            limit: 1,
          });

          return {
            id: dm.id,
            user: dm.user,
            userName: userInfo.user?.real_name || userInfo.user?.name || 'Unknown',
            userImage: userInfo.user?.profile?.image_72 || '',
            lastMessage: history.messages?.[0]?.text || 'No messages',
            unread: dm.unread_count || 0,
          };
        } catch (error) {
          return null;
        }
      });

      const dms = await Promise.all(dmPromises);
      return dms.filter(Boolean);
    } catch (error) {
      console.error('Error fetching direct messages:', error);
      throw error;
    }
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    if (!this.client) return false;

    try {
      const result = await this.client.auth.test();
      return result.ok === true;
    } catch (error) {
      console.error('Error testing Slack connection:', error);
      return false;
    }
  }

  // Get current workspace info
  getWorkspace(): SlackWorkspaceInfo | null {
    return this.workspaceInfo;
  }
}

export const slackService = new SlackService();