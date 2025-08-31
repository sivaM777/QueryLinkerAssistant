import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import {
  insertSystemSchema,
  insertSolutionSchema,
  insertInteractionSchema,
  insertSLATargetSchema,
  insertNotificationSchema,
  insertSearchQuerySchema,
  insertDataSourceSchema,
  insertIncidentSchema,
} from "@shared/schema";
import { syncService } from './connectors';
import { syncScheduler } from './scheduler';
import { googleMeetService } from './googleMeetService';
import { insertGoogleMeetingSchema, insertUserSchema } from '@shared/schema';
import bcrypt from 'bcryptjs';
import { emailService } from './emailService';
import { slackService } from './slackService';

export async function registerRoutes(app: Express): Promise<Server> {

  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const userData = {
        email,
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
        role: 'user',
        emailVerified: false,
        authProvider: 'email'
      };
      
      const user = await storage.createEmailUser(userData);
      
      // Don't return password in response
      const { password: _, ...userResponse } = user;
      
      res.status(201).json({ 
        message: "User registered successfully", 
        user: userResponse 
      });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Get user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or incorrect password" });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password || '');
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or incorrect password" });
      }

      // Update last login
      await storage.updateUserLastLogin(user.id);
      
      // Don't return password in response
      const { password: _, ...userResponse } = user;
      
      res.json({ 
        message: "Login successful", 
        user: userResponse 
      });
    } catch (error) {
      console.error("Error logging in user:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Password reset request
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Return success message even if user doesn't exist (security best practice)
        return res.json({ 
          message: "If an account with that email exists, we've sent password reset instructions." 
        });
      }

      // Generate reset token
      const resetToken = emailService.generateResetToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store reset token in database
      await storage.setPasswordResetToken(user.id, resetToken, resetExpires);

      // Create reset URL
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;

      // Send email
      const emailSent = await emailService.sendPasswordResetEmail({
        to: user.email!,
        firstName: user.firstName || 'User',
        resetToken,
        resetUrl
      });

      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send reset email" });
      }

      res.json({ 
        message: "If an account with that email exists, we've sent password reset instructions." 
      });
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Password reset confirmation
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      // Find user by reset token
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Check if token is expired
      if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        return res.status(400).json({ message: "Reset token has expired" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear reset token
      await storage.updateUserPassword(user.id, hashedPassword);

      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Error in reset password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Verify reset token
  app.get('/api/auth/verify-reset-token/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ valid: false, message: "Invalid reset token" });
      }

      // Check if token is expired
      if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        return res.status(400).json({ valid: false, message: "Reset token has expired" });
      }

      res.json({ valid: true, email: user.email });
    } catch (error) {
      console.error("Error verifying reset token:", error);
      res.status(500).json({ valid: false, message: "Failed to verify token" });
    }
  });

  // Dashboard metrics
  app.get('/api/dashboard/metrics', async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // Systems management
  app.get('/api/systems', async (req, res) => {
    try {
      const systems = await storage.getSystems();
      res.json(systems);
    } catch (error) {
      console.error("Error fetching systems:", error);
      res.status(500).json({ message: "Failed to fetch systems" });
    }
  });

  app.post('/api/systems', async (req, res) => {
    try {
      const systemData = insertSystemSchema.parse(req.body);
      const system = await storage.createSystem(systemData);
      res.status(201).json(system);
    } catch (error) {
      console.error("Error creating system:", error);
      res.status(500).json({ message: "Failed to create system" });
    }
  });

  app.put('/api/systems/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertSystemSchema.partial().parse(req.body);
      const system = await storage.updateSystem(id, updates);
      res.json(system);
    } catch (error) {
      console.error("Error updating system:", error);
      res.status(500).json({ message: "Failed to update system" });
    }
  });

  app.delete('/api/systems/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Attempting to delete system with ID: ${id}`);

      // Delete the system (solutions will be handled by cascade)
      const deleted = await storage.deleteSystem(id);

      if (!deleted) {
        console.log(`System with ID ${id} not found`);
        return res.status(404).json({ message: "System not found" });
      }

      console.log(`Successfully deleted system with ID: ${id}`);

      // Broadcast system removal via WebSocket
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'system_removed',
            data: { systemId: id, timestamp: new Date() }
          }));
        }
      });

      res.json({ message: "System deleted successfully" });
    } catch (error) {
      console.error("Error deleting system:", error);
      res.status(500).json({ message: "Failed to delete system" });
    }
  });

  // Reset/clear all systems (for testing purposes)
  app.delete('/api/systems', async (req, res) => {
    try {
      const systems = await storage.getSystems();
      let deletedCount = 0;

      for (const system of systems) {
        // Delete the system (solutions will be handled by cascade)
        const deleted = await storage.deleteSystem(system.id);
        if (deleted) deletedCount++;
      }

      console.log(`Reset: Deleted ${deletedCount} systems`);

      // Broadcast reset via WebSocket
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'systems_reset',
            data: { deletedCount, timestamp: new Date() }
          }));
        }
      });

      res.json({ message: `Successfully deleted ${deletedCount} systems` });
    } catch (error) {
      console.error("Error resetting systems:", error);
      res.status(500).json({ message: "Failed to reset systems" });
    }
  });

  app.post('/api/systems/:id/sync', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const system = await storage.getSystem(id);
      
      if (!system) {
        return res.status(404).json({ message: "System not found" });
      }
      
      // Update sync time
      await storage.updateSystemSyncTime(id);
      
      // Broadcast sync update via WebSocket
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'system_sync',
            data: { systemId: id, timestamp: new Date() }
          }));
        }
      });
      
      res.json({ message: "Sync completed" });
    } catch (error) {
      console.error("Error syncing system:", error);
      res.status(500).json({ message: "Failed to sync system" });
    }
  });

  // Solutions management
  app.get('/api/solutions', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      
      const solutions = await storage.getSolutions(limit, offset);
      res.json(solutions);
    } catch (error) {
      console.error("Error fetching solutions:", error);
      res.status(500).json({ message: "Failed to fetch solutions" });
    }
  });

  app.get('/api/solutions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const solution = await storage.getSolution(id);
      
      if (!solution) {
        return res.status(404).json({ message: "Solution not found" });
      }
      
      // Solution view tracking removed (no authentication)
      
      res.json(solution);
    } catch (error) {
      console.error("Error fetching solution:", error);
      res.status(500).json({ message: "Failed to fetch solution" });
    }
  });

  // AI-powered search
  app.post('/api/search', async (req, res) => {
    try {
      const { query, systems: systemIds } = req.body;
      if (!query || query.trim().length === 0) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const solutions = await storage.searchSolutions(query, systemIds);
      
      // Search query tracking removed (no authentication)
      
      res.json({
        query,
        results: solutions,
        resultsCount: solutions.length,
        confidence: Math.floor(Math.random() * 20) + 80,
      });
    } catch (error) {
      console.error("Error performing search:", error);
      res.status(500).json({ message: "Failed to perform search" });
    }
  });

  app.get('/api/search/recent', async (req, res) => {
    try {
      // Recent searches unavailable without authentication
      res.json([]);
    } catch (error) {
      console.error("Error fetching recent searches:", error);
      res.status(500).json({ message: "Failed to fetch recent searches" });
    }
  });

  app.get('/api/search/popular', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const popularSearches = await storage.getPopularSearches(limit);
      res.json(popularSearches);
    } catch (error) {
      console.error("Error fetching popular searches:", error);
      res.status(500).json({ message: "Failed to fetch popular searches" });
    }
  });

  // SLA management
  app.get('/api/sla/targets', async (req, res) => {
    try {
      const targets = await storage.getSLATargets();
      res.json(targets);
    } catch (error) {
      console.error("Error fetching SLA targets:", error);
      res.status(500).json({ message: "Failed to fetch SLA targets" });
    }
  });

  app.get('/api/sla/status', async (req, res) => {
    try {
      const status = await storage.getSLAStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching SLA status:", error);
      res.status(500).json({ message: "Failed to fetch SLA status" });
    }
  });

  // Notifications
  app.get('/api/notifications', async (req, res) => {
    try {
      // Notifications unavailable without authentication
      res.json([]);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.markNotificationRead(id);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Analytics
  app.get('/api/analytics/popular-solutions', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const popularSolutions = await storage.getPopularSolutions(limit);
      res.json(popularSolutions);
    } catch (error) {
      console.error("Error fetching popular solutions:", error);
      res.status(500).json({ message: "Failed to fetch popular solutions" });
    }
  });

  // User interactions
  app.post('/api/interactions', async (req, res) => {
    try {
      // User interactions unavailable without authentication
      res.status(201).json({ message: "Interaction tracking disabled" });
    } catch (error) {
      console.error("Error creating interaction:", error);
      res.status(500).json({ message: "Failed to create interaction" });
    }
  });

  // Data sources management
  app.get('/api/data-sources', async (req, res) => {
    try {
      const dataSources = await storage.getDataSources();
      res.json(dataSources);
    } catch (error) {
      console.error("Error fetching data sources:", error);
      res.status(500).json({ message: "Failed to fetch data sources" });
    }
  });

  app.post('/api/data-sources', async (req, res) => {
    try {
      const dataSourceData = insertDataSourceSchema.parse(req.body);
      const dataSource = await storage.createDataSource(dataSourceData);
      res.status(201).json(dataSource);
    } catch (error) {
      console.error("Error creating data source:", error);
      res.status(500).json({ message: "Failed to create data source" });
    }
  });

  app.put('/api/data-sources/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertDataSourceSchema.partial().parse(req.body);
      const dataSource = await storage.updateDataSource(id, updates);
      res.json(dataSource);
    } catch (error) {
      console.error("Error updating data source:", error);
      res.status(500).json({ message: "Failed to update data source" });
    }
  });

  app.post('/api/data-sources/:id/sync', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const dataSource = await storage.getDataSource(id);
      
      if (!dataSource) {
        return res.status(404).json({ message: "Data source not found" });
      }
      
      // Trigger sync for this specific data source
      await syncService.syncAllDataSources();
      
      // Broadcast sync update via WebSocket
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'data_source_sync',
            data: { dataSourceId: id, timestamp: new Date() }
          }));
        }
      });
      
      res.json({ message: "Sync initiated successfully" });
    } catch (error) {
      console.error("Error syncing data source:", error);
      res.status(500).json({ message: "Failed to sync data source" });
    }
  });

  // Incidents management
  app.get('/api/incidents', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      
      const incidents = await storage.getIncidents(limit, offset);
      res.json(incidents);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      res.status(500).json({ message: "Failed to fetch incidents" });
    }
  });

  app.get('/api/incidents/active', async (req, res) => {
    try {
      const incidents = await storage.getActiveIncidents();
      res.json(incidents);
    } catch (error) {
      console.error("Error fetching active incidents:", error);
      res.status(500).json({ message: "Failed to fetch active incidents" });
    }
  });

  app.get('/api/incidents/status/:status', async (req, res) => {
    try {
      const { status } = req.params;
      const incidents = await storage.getIncidentsByStatus(status);
      res.json(incidents);
    } catch (error) {
      console.error("Error fetching incidents by status:", error);
      res.status(500).json({ message: "Failed to fetch incidents by status" });
    }
  });

  app.get('/api/incidents/severity/:severity', async (req, res) => {
    try {
      const { severity } = req.params;
      const incidents = await storage.getIncidentsBySeverity(severity);
      res.json(incidents);
    } catch (error) {
      console.error("Error fetching incidents by severity:", error);
      res.status(500).json({ message: "Failed to fetch incidents by severity" });
    }
  });

  app.get('/api/incidents/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const incident = await storage.getIncident(id);
      
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }
      
      const updates = await storage.getIncidentUpdates(id);
      res.json({ ...incident, updates });
    } catch (error) {
      console.error("Error fetching incident:", error);
      res.status(500).json({ message: "Failed to fetch incident" });
    }
  });

  app.get('/api/incidents/:id/updates', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = await storage.getIncidentUpdates(id);
      res.json(updates);
    } catch (error) {
      console.error("Error fetching incident updates:", error);
      res.status(500).json({ message: "Failed to fetch incident updates" });
    }
  });

  // Service components
  app.get('/api/service-components', async (req, res) => {
    try {
      const dataSourceId = req.query.dataSourceId ? parseInt(req.query.dataSourceId as string) : undefined;
      const components = await storage.getServiceComponents(dataSourceId);
      res.json(components);
    } catch (error) {
      console.error("Error fetching service components:", error);
      res.status(500).json({ message: "Failed to fetch service components" });
    }
  });

  // Incident metrics and analytics
  app.get('/api/incident-metrics', async (req, res) => {
    try {
      const dataSourceId = req.query.dataSourceId ? parseInt(req.query.dataSourceId as string) : undefined;
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const metrics = await storage.getIncidentMetrics(dataSourceId, days);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching incident metrics:", error);
      res.status(500).json({ message: "Failed to fetch incident metrics" });
    }
  });

  // OAuth Authentication routes for systems
  app.get('/api/auth/:system/login', async (req, res) => {
    try {
      const { system } = req.params;
      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/${system}/callback`;
      
      const authUrls = {
        slack: `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=channels:read,chat:write,users:read,conversations:history,conversations:read&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`,
        googlemeet: googleMeetService.getAuthUrl(),
        zendesk: `https://${process.env.ZENDESK_SUBDOMAIN}.zendesk.com/oauth/authorizations/new?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${process.env.ZENDESK_CLIENT_ID}&scope=read`,
        notion: `https://api.notion.com/v1/oauth/authorize?client_id=${process.env.NOTION_CLIENT_ID}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}`,
        linear: `https://linear.app/oauth/authorize?client_id=${process.env.LINEAR_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read&response_type=code`
      };
      
      const authUrl = authUrls[system as keyof typeof authUrls];
      if (!authUrl) {
        return res.status(400).json({ message: 'Unsupported system' });
      }

      // For Slack, redirect directly to authorization URL
      if (system === 'slack') {
        return res.redirect(authUrl);
      }
      
      res.json({ authUrl, redirectUri });
    } catch (error) {
      console.error(`Error generating ${req.params.system} auth URL:`, error);
      res.status(500).json({ message: 'Failed to generate auth URL' });
    }
  });

  // Handle Slack OAuth callback (GET request from Slack)
  app.get('/api/auth/slack/callback', async (req, res) => {
    try {
      const { code, error } = req.query;
      
      if (error) {
        console.error('Slack OAuth error:', error);
        return res.send(`
          <html>
            <body>
              <h2>Connection Failed</h2>
              <p>Failed to connect to Slack: ${error}</p>
              <script>
                setTimeout(() => window.close(), 3000);
              </script>
            </body>
          </html>
        `);
      }

      if (!code) {
        return res.send(`
          <html>
            <body>
              <h2>Connection Failed</h2>
              <p>No authorization code received from Slack</p>
              <script>
                setTimeout(() => window.close(), 3000);
              </script>
            </body>
          </html>
        `);
      }

      // Exchange code for access token
      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/slack/callback`;
      const workspaceInfo = await slackService.exchangeCodeForToken(code as string, redirectUri);
      
      console.log('Slack workspace connected:', workspaceInfo.teamName);
      
      return res.send(`
        <html>
          <body>
            <h2>Successfully Connected!</h2>
            <p>Your Slack workspace "${workspaceInfo.teamName}" has been connected to QueryLinker.</p>
            <p>You can now close this window and return to the application.</p>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error in Slack OAuth callback:', error);
      return res.send(`
        <html>
          <body>
            <h2>Connection Failed</h2>
            <p>An error occurred while connecting to Slack. Please try again.</p>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);
    }
  });

  app.post('/api/auth/:system/callback', async (req, res) => {
    try {
      const { system } = req.params;
      const { code, state } = req.body;
      
      // For other systems, use mock data
      const authData = {
        system,
        accessToken: `mock_token_${system}_${Date.now()}`,
        userId: `user_${system}_${Math.random().toString(36).substr(2, 9)}`,
        authenticatedAt: new Date().toISOString()
      };
      
      // Update the system to mark as authenticated
      const systems = await storage.getSystems();
      const systemRecord = systems.find(s => s.type === system);
      if (systemRecord) {
        await storage.updateSystem(systemRecord.id, { 
          isActive: true,
          lastSyncAt: new Date()
        });
      }
      
      res.json({ 
        success: true, 
        message: `Successfully authenticated with ${system}`,
        authData: { system, userId: authData.userId }
      });
    } catch (error) {
      console.error(`Error handling ${req.params.system} auth callback:`, error);
      res.status(500).json({ message: 'Authentication failed' });
    }
  });

  app.get('/api/auth/:system/status', async (req, res) => {
    try {
      const { system } = req.params;
      
      // Check if system is authenticated (in a real app, check session/database)
      const systems = await storage.getSystems();
      const systemRecord = systems.find(s => s.type === system);
      
      res.json({
        authenticated: systemRecord?.isActive || false,
        system,
        lastSync: systemRecord?.lastSyncAt
      });
    } catch (error) {
      console.error(`Error checking ${req.params.system} auth status:`, error);
      res.status(500).json({ message: 'Failed to check auth status' });
    }
  });

  // System workspace data endpoints
  app.get('/api/systems/:system/workspace', async (req, res) => {
    try {
      const { system } = req.params;
      
      // Return workspace configuration for embedded apps
      const workspaceConfigs = {
        slack: {
          embedUrl: 'https://app.slack.com/client',
          features: ['channels', 'direct-messages', 'search'],
          apiEndpoints: {
            channels: '/api/integrations/slack/channels',
            messages: '/api/integrations/slack/messages'
          }
        },
        googlemeet: {
          embedUrl: null, // Don't embed external Google Meet - use custom interface
          features: ['meetings', 'calendar', 'recordings'],
          apiEndpoints: {
            meetings: '/api/integrations/googlemeet/meetings',
            calendar: '/api/integrations/googlemeet/calendar'
          },
          customInterface: true // Flag to show custom interface instead of iframe
        },
        zendesk: {
          embedUrl: `https://${process.env.ZENDESK_SUBDOMAIN || 'demo'}.zendesk.com`,
          features: ['tickets', 'knowledge-base', 'reports'],
          apiEndpoints: {
            tickets: '/api/integrations/zendesk/tickets',
            users: '/api/integrations/zendesk/users'
          }
        },
        notion: {
          embedUrl: 'https://www.notion.so',
          features: ['pages', 'databases', 'search'],
          apiEndpoints: {
            pages: '/api/integrations/notion/pages',
            databases: '/api/integrations/notion/databases'
          }
        },
        linear: {
          embedUrl: 'https://linear.app',
          features: ['issues', 'projects', 'roadmap'],
          apiEndpoints: {
            issues: '/api/integrations/linear/issues',
            projects: '/api/integrations/linear/projects'
          }
        }
      };
      
      const config = workspaceConfigs[system as keyof typeof workspaceConfigs];
      if (!config) {
        return res.status(400).json({ message: 'Unsupported system' });
      }
      
      res.json(config);
    } catch (error) {
      console.error(`Error fetching ${req.params.system} workspace config:`, error);
      res.status(500).json({ message: 'Failed to fetch workspace config' });
    }
  });

  // Notifications endpoint
  app.get('/api/notifications', async (req, res) => {
    try {
      // Mock notifications data
      const notifications = [
        {
          id: 1,
          title: "System Maintenance Scheduled",
          message: "Maintenance window scheduled for tonight at 2 AM EST",
          type: "info",
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        },
        {
          id: 2,
          title: "Incident Resolved",
          message: "Network connectivity issue has been resolved",
          type: "success",
          read: true,
          createdAt: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
        }
      ];

      // Filter by unread if requested
      const unreadOnly = req.query.unread === 'true';
      const filteredNotifications = unreadOnly
        ? notifications.filter(n => !n.read)
        : notifications;

      res.json(filteredNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Integration API endpoints (mock data for embedded apps)
  // Slack integration endpoints
  app.get('/api/integrations/slack/channels', async (req, res) => {
    try {
      const channels = await slackService.getChannels();
      res.json(channels);
    } catch (error) {
      console.error('Error fetching Slack channels:', error);
      res.status(500).json({ error: 'Failed to fetch channels' });
    }
  });

  app.get('/api/integrations/slack/messages/:channelId', async (req, res) => {
    try {
      const { channelId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const messages = await slackService.getChannelMessages(channelId, limit);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching Slack messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.post('/api/integrations/slack/message', async (req, res) => {
    try {
      const { channel, text } = req.body;
      const result = await slackService.sendMessage(channel, text);
      res.json({ success: true, result });
    } catch (error) {
      console.error('Error sending Slack message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  app.get('/api/integrations/slack/direct-messages', async (req, res) => {
    try {
      const dms = await slackService.getDirectMessages();
      res.json(dms);
    } catch (error) {
      console.error('Error fetching direct messages:', error);
      res.status(500).json({ error: 'Failed to fetch direct messages' });
    }
  });

  app.get('/api/integrations/slack/workspace', async (req, res) => {
    try {
      const workspaceInfo = await slackService.getWorkspaceInfo();
      res.json(workspaceInfo);
    } catch (error) {
      console.error('Error fetching workspace info:', error);
      res.status(500).json({ error: 'Failed to fetch workspace info' });
    }
  });

  app.post('/api/integrations/slack/incident-notification', async (req, res) => {
    try {
      const { channelId, incident } = req.body;
      const result = await slackService.sendIncidentNotification(channelId, incident);
      res.json({ success: true, result });
    } catch (error) {
      console.error('Error sending incident notification:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  app.get('/api/integrations/slack/status', async (req, res) => {
    try {
      const isConnected = await slackService.testConnection();
      const workspace = slackService.getWorkspace();
      res.json({ 
        connected: isConnected,
        workspace: workspace ? {
          teamName: workspace.teamName,
          teamId: workspace.teamId
        } : null
      });
    } catch (error) {
      console.error('Error checking Slack status:', error);
      res.json({ connected: false, workspace: null });
    }
  });

  // Google Meet Authentication Routes
  app.get('/api/auth/google/login', async (req, res) => {
    try {
      const authUrl = googleMeetService.getAuthUrl();
      res.json({ authUrl, redirectUri: `${req.protocol}://${req.get('host')}/api/auth/google/callback` });
    } catch (error) {
      console.error('Error generating Google auth URL:', error);
      res.status(500).json({ message: 'Failed to generate auth URL' });
    }
  });

  app.post('/api/auth/google/callback', async (req, res) => {
    try {
      const { code, userId } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: 'Authorization code is required' });
      }

      // For demo purposes, use a mock userId. In production, get from authenticated session
      const mockUserId = userId || `user_${Date.now()}`;

      const tokenData = await googleMeetService.exchangeCodeForTokens(code);
      await googleMeetService.storeUserTokens(mockUserId, {
        userId: mockUserId,
        ...tokenData
      });

      res.json({ 
        success: true, 
        message: 'Successfully authenticated with Google',
        userId: mockUserId
      });
    } catch (error) {
      console.error('Error handling Google auth callback:', error);
      res.status(500).json({ message: 'Authentication failed' });
    }
  });

  app.get('/api/auth/google/status/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const tokens = await googleMeetService.getUserTokens(userId);
      
      res.json({
        authenticated: !!tokens,
        userId,
        hasTokens: !!tokens
      });
    } catch (error) {
      console.error('Error checking Google auth status:', error);
      res.status(500).json({ message: 'Failed to check auth status' });
    }
  });

  // Google Meet Management Routes
  app.post('/api/googlemeet/meetings', async (req, res) => {
    try {
      // Convert datetime strings to Date objects before validation
      const rawData = req.body;
      const processedData = {
        ...rawData,
        startTime: new Date(rawData.startTime),
        endTime: new Date(rawData.endTime)
      };

      const meetingData = insertGoogleMeetingSchema.omit({ 
        calendarEventId: true, 
        meetingId: true, 
        meetLink: true,
        status: true,
        metadata: true
      }).parse(processedData);
      
      // For demo purposes, use a mock userId. In production, get from authenticated session
      const userId = rawData.userId || `user_${Date.now()}`;

      const meeting = await googleMeetService.createMeeting(userId, {
        title: meetingData.title,
        description: meetingData.description || undefined,
        startTime: meetingData.startTime,
        endTime: meetingData.endTime,
        attendees: meetingData.attendees as string[] || [],
        incidentId: meetingData.incidentId || undefined,
        systemId: meetingData.systemId || undefined
      });

      res.status(201).json(meeting);
    } catch (error) {
      console.error('Error creating Google Meet meeting:', error);
      res.status(500).json({ 
        message: 'Failed to create meeting',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/googlemeet/meetings/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const meetings = await googleMeetService.getUserMeetings(userId, limit);
      res.json(meetings);
    } catch (error) {
      console.error('Error fetching user meetings:', error);
      res.status(500).json({ message: 'Failed to fetch meetings' });
    }
  });

  app.get('/api/googlemeet/meetings/meeting/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const meeting = await storage.getGoogleMeeting(id);
      
      if (!meeting) {
        return res.status(404).json({ message: 'Meeting not found' });
      }
      
      res.json(meeting);
    } catch (error) {
      console.error('Error fetching meeting:', error);
      res.status(500).json({ message: 'Failed to fetch meeting' });
    }
  });

  app.put('/api/googlemeet/meetings/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { userId, ...updates } = req.body;
      
      const result = await googleMeetService.updateMeeting(userId, id, {
        title: updates.title,
        description: updates.description,
        startTime: updates.startTime ? new Date(updates.startTime) : undefined,
        endTime: updates.endTime ? new Date(updates.endTime) : undefined
      });

      res.json(result);
    } catch (error) {
      console.error('Error updating meeting:', error);
      res.status(500).json({ 
        message: 'Failed to update meeting',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.delete('/api/googlemeet/meetings/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { userId } = req.body;
      
      const result = await googleMeetService.cancelMeeting(userId, id);
      res.json(result);
    } catch (error) {
      console.error('Error cancelling meeting:', error);
      res.status(500).json({ 
        message: 'Failed to cancel meeting',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/integrations/googlemeet/meetings', async (req, res) => {
    res.json([
      {
        id: 'GM1',
        title: 'Sprint Planning',
        startTime: '2024-01-15T15:00:00Z',
        endTime: '2024-01-15T16:00:00Z',
        attendees: 8,
        status: 'upcoming',
        meetLink: 'https://meet.google.com/abc-defg-hij'
      },
      {
        id: 'GM2',
        title: 'Daily Standup',
        startTime: '2024-01-16T09:00:00Z',
        endTime: '2024-01-16T09:30:00Z',
        attendees: 12,
        status: 'recurring',
        meetLink: 'https://meet.google.com/xyz-1234-uvw'
      }
    ]);
  });

  app.post('/api/integrations/googlemeet/create', async (req, res) => {
    const { title, startTime, endTime, description } = req.body;
    console.log(`Mock Google Meet created: ${title} from ${startTime} to ${endTime}`);
    res.json({
      success: true,
      meeting: {
        id: `GM_${Date.now()}`,
        title,
        startTime,
        endTime,
        meetLink: `https://meet.google.com/mock-${Math.random().toString(36).substr(2, 9)}`,
        calendarEventId: `cal_${Date.now()}`
      }
    });
  });

  app.get('/api/integrations/zendesk/tickets', async (req, res) => {
    res.json([
      {
        id: 12345,
        subject: 'Login issues with mobile app',
        status: 'open',
        priority: 'high',
        requester: 'John Smith',
        assignee: 'Support Team',
        tags: ['mobile', 'authentication']
      },
      {
        id: 12346,
        subject: 'Feature request: Dark mode',
        status: 'pending',
        priority: 'low',
        requester: 'Sarah Johnson',
        assignee: 'Development Team',
        tags: ['feature', 'ui']
      }
    ]);
  });

  // Trigger manual sync of all data sources
  app.post('/api/sync/all', async (req, res) => {
    try {
      // Run sync in background
      syncService.syncAllDataSources().catch(error => {
        console.error('Background sync failed:', error);
      });
      
      // Broadcast sync start via WebSocket
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'sync_started',
            data: { timestamp: new Date() }
          }));
        }
      });
      
      res.json({ message: "Sync started for all data sources" });
    } catch (error) {
      console.error("Error starting sync:", error);
      res.status(500).json({ message: "Failed to start sync" });
    }
  });

  const httpServer = createServer(app);

  // Start the sync scheduler
  await syncScheduler.start();

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      data: { message: 'Connected to QueryLinker WebSocket' }
    }));

    // Handle client messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        } else if (data.type === 'subscribe_incidents') {
          // Client wants to subscribe to incident updates
          ws.send(JSON.stringify({ 
            type: 'subscribed', 
            data: { channel: 'incidents' } 
          }));
        } else if (data.type === 'get_active_incidents') {
          // Send current active incidents
          try {
            const activeIncidents = await storage.getActiveIncidents();
            ws.send(JSON.stringify({ 
              type: 'active_incidents', 
              data: activeIncidents 
            }));
          } catch (error) {
            console.error('Error fetching active incidents for WebSocket:', error);
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    syncScheduler.stop();
    wss.close(() => {
      console.log('WebSocket server closed');
    });
  });

  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    syncScheduler.stop();
    wss.close(() => {
      console.log('WebSocket server closed');
    });
  });

  return httpServer;
}
