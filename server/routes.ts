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

      // Generate verification code
      const verificationCode = emailService.generateVerificationCode();
      const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      // Store verification code in database
      await storage.setPasswordResetCode(user.id, verificationCode, resetExpires);

      // Send email
      const emailSent = await emailService.sendPasswordResetEmail({
        to: user.email!,
        firstName: user.firstName || 'User',
        verificationCode
      });

      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send reset email" });
      }

      // In development mode, provide the verification code directly
      const isDevelopment = !process.env.SMTP_HOST;
      const responseMessage = isDevelopment 
        ? `Development mode: Verification code sent. Code: ${verificationCode}`
        : "If an account with that email exists, we've sent a verification code to your email.";

      res.json({ 
        message: responseMessage,
        ...(isDevelopment && { verificationCode }) // Include code in development
      });
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Verify reset code
  app.post('/api/auth/verify-reset-code', async (req, res) => {
    try {
      const { email, code } = req.body;
      
      if (!email || !code) {
        return res.status(400).json({ message: "Email and verification code are required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      // Check if code matches and is not expired
      if (user.passwordResetCode !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
      }

      res.json({ 
        valid: true, 
        email: user.email,
        message: "Verification code is valid" 
      });
    } catch (error) {
      console.error("Error verifying reset code:", error);
      res.status(500).json({ message: "Failed to verify code" });
    }
  });

  // Password reset confirmation
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      
      if (!email || !code || !newPassword) {
        return res.status(400).json({ message: "Email, verification code, and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      // Check if code matches and is not expired
      if (user.passwordResetCode !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        return res.status(400).json({ message: "Verification code has expired. Please request a new one." });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear reset code
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
      const host = process.env.REPLIT_DOMAINS || req.get('host');
      const redirectUri = `https://${host}/api/auth/${system}/callback`;
      
      const authUrls = {
        slack: `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=chat:write,channels:read,groups:read,im:read,users:read&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`,
        googlemeet: googleMeetService.getAuthUrl(),
        zendesk: `https://${process.env.ZENDESK_SUBDOMAIN}.zendesk.com/oauth/authorizations/new?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${process.env.ZENDESK_CLIENT_ID}&scope=read`,
        notion: `https://api.notion.com/v1/oauth/authorize?client_id=${process.env.NOTION_CLIENT_ID}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}`,
        linear: `https://linear.app/oauth/authorize?client_id=${process.env.LINEAR_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read&response_type=code`,
        jira: `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${process.env.JIRA_CLIENT_ID}&scope=read:jira-work%20read:jira-user%20read:project:jira&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(JSON.stringify({ system: 'jira' }))}&response_type=code&prompt=consent`
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
      const host = process.env.REPLIT_DOMAINS || req.get('host');
      const redirectUri = `https://${host}/api/auth/slack/callback`;
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

  // Jira OAuth callback handler
  app.get('/api/auth/jira/callback', async (req, res) => {
    try {
      const { code, error, state } = req.query;
      
      if (error) {
        console.error('Jira OAuth error:', error);
        return res.send(`
          <html>
            <body>
              <h2>Connection Failed</h2>
              <p>Failed to connect to Jira: ${error}</p>
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
              <p>No authorization code received from Jira</p>
              <script>
                setTimeout(() => window.close(), 3000);
              </script>
            </body>
          </html>
        `);
      }

      // Exchange code for access token
      const host = process.env.REPLIT_DOMAINS || req.get('host');
      const redirectUri = `https://${host}/api/auth/jira/callback`;
      
      const tokenResponse = await fetch('https://auth.atlassian.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: process.env.JIRA_CLIENT_ID,
          client_secret: process.env.JIRA_CLIENT_SECRET,
          code: code as string,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        console.error('Jira token exchange error:', tokenData);
        throw new Error('Failed to exchange code for token');
      }

      // Get user's accessible resources (Jira sites)
      const resourceResponse = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json',
        },
      });

      const resources = await resourceResponse.json();
      
      if (!resources || resources.length === 0) {
        throw new Error('No accessible Jira resources found');
      }

      // Use the first resource (site)
      const jiraSite = resources[0];
      
      // Create or update Jira data source
      const jiraConfig = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000),
        site_id: jiraSite.id,
        site_name: jiraSite.name,
        site_url: jiraSite.url,
        scope: tokenData.scope,
      };

      // Create or update the Jira data source in the database
      const existingDataSources = await storage.getDataSources();
      const existingJira = existingDataSources.find(ds => ds.type === 'jira');

      if (existingJira) {
        await storage.updateDataSource(existingJira.id, {
          baseUrl: jiraSite.url,
          oauthConfig: jiraConfig,
          isActive: true,
          lastSyncAt: new Date(),
        });
      } else {
        await storage.createDataSource({
          name: `Jira - ${jiraSite.name}`,
          type: 'jira',
          baseUrl: jiraSite.url,
          oauthConfig: jiraConfig,
          syncInterval: 300, // 5 minutes
          isActive: true,
        });
      }

      console.log('Jira site connected:', jiraSite.name);
      
      return res.send(`
        <html>
          <body>
            <h2>Successfully Connected!</h2>
            <p>Your Jira site "${jiraSite.name}" has been connected to QueryLinker.</p>
            <p>You can now close this window and return to the application.</p>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error in Jira OAuth callback:', error);
      return res.send(`
        <html>
          <body>
            <h2>Connection Failed</h2>
            <p>An error occurred while connecting to Jira. Please try again.</p>
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
          embedUrl: null, // Don't embed external Slack - use custom interface
          features: ['channels', 'direct-messages', 'search', 'real-time-messaging'],
          apiEndpoints: {
            channels: '/api/integrations/slack/channels',
            messages: '/api/integrations/slack/messages',
            status: '/api/integrations/slack/status',
            workspace: '/api/integrations/slack/workspace'
          },
          customInterface: true // Flag to show custom interface instead of iframe
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
        },
        jira: {
          embedUrl: null, // Don't embed external Jira - use custom interface
          features: ['issues', 'projects', 'workflows', 'reporting'],
          apiEndpoints: {
            issues: '/api/integrations/jira/issues',
            projects: '/api/integrations/jira/projects',
            create: '/api/integrations/jira/issues'
          },
          customInterface: true // Flag to show custom interface instead of iframe
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

  // Jira integration endpoints
  app.get('/api/integrations/jira/projects', async (req, res) => {
    try {
      // Get Jira data source with OAuth config
      const dataSources = await storage.getDataSources();
      const jiraDataSource = dataSources.find(ds => ds.type === 'jira' && ds.isActive);
      
      if (!jiraDataSource || !jiraDataSource.oauthConfig) {
        return res.status(401).json({ message: 'Jira not connected or configured' });
      }

      const { access_token, site_url } = jiraDataSource.oauthConfig;
      
      // Fetch projects from Jira
      const response = await fetch(`${site_url}/rest/api/3/project`, {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.status}`);
      }

      const projects = await response.json();
      res.json(projects);
    } catch (error) {
      console.error('Error fetching Jira projects:', error);
      res.status(500).json({ message: 'Failed to fetch projects' });
    }
  });

  app.get('/api/integrations/jira/issues', async (req, res) => {
    try {
      // Get Jira data source with OAuth config
      const dataSources = await storage.getDataSources();
      const jiraDataSource = dataSources.find(ds => ds.type === 'jira' && ds.isActive);
      
      if (!jiraDataSource || !jiraDataSource.oauthConfig) {
        return res.status(401).json({ message: 'Jira not connected or configured' });
      }

      const { access_token, site_url } = jiraDataSource.oauthConfig;
      const { project, status } = req.query;
      
      // Build JQL query
      let jql = 'ORDER BY updated DESC';
      const conditions = [];
      
      if (project) {
        conditions.push(`project = "${project}"`);
      }
      if (status && status !== 'all') {
        conditions.push(`status = "${status}"`);
      }
      
      if (conditions.length > 0) {
        jql = `${conditions.join(' AND ')} ORDER BY updated DESC`;
      }
      
      // Fetch issues from Jira
      const response = await fetch(`${site_url}/rest/api/3/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jql,
          maxResults: 100,
          fields: [
            'summary',
            'status',
            'priority',
            'issuetype',
            'assignee',
            'reporter',
            'created',
            'updated',
            'description',
            'project'
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.status}`);
      }

      const searchResults = await response.json();
      
      // Transform Jira issues to our format
      const issues = searchResults.issues.map((issue: any) => ({
        id: issue.id,
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        priority: issue.fields.priority.name,
        issueType: issue.fields.issuetype.name,
        assignee: issue.fields.assignee ? {
          displayName: issue.fields.assignee.displayName,
          avatarUrl: issue.fields.assignee.avatarUrls?.['24x24']
        } : null,
        reporter: issue.fields.reporter ? {
          displayName: issue.fields.reporter.displayName,
          avatarUrl: issue.fields.reporter.avatarUrls?.['24x24']
        } : null,
        created: issue.fields.created,
        updated: issue.fields.updated,
        description: issue.fields.description,
        project: {
          key: issue.fields.project.key,
          name: issue.fields.project.name
        }
      }));

      res.json(issues);
    } catch (error) {
      console.error('Error fetching Jira issues:', error);
      res.status(500).json({ message: 'Failed to fetch issues' });
    }
  });

  app.post('/api/integrations/jira/issues', async (req, res) => {
    try {
      // Get Jira data source with OAuth config
      const dataSources = await storage.getDataSources();
      const jiraDataSource = dataSources.find(ds => ds.type === 'jira' && ds.isActive);
      
      if (!jiraDataSource || !jiraDataSource.oauthConfig) {
        return res.status(401).json({ message: 'Jira not connected or configured' });
      }

      const { access_token, site_url } = jiraDataSource.oauthConfig;
      const { summary, description, priority, issueType, projectKey } = req.body;
      
      if (!summary || !projectKey) {
        return res.status(400).json({ message: 'Summary and project key are required' });
      }

      // Create issue in Jira
      const issueData = {
        fields: {
          project: {
            key: projectKey
          },
          summary,
          description: {
            type: 'doc',
            version: 1,
            content: [{
              type: 'paragraph',
              content: [{
                type: 'text',
                text: description || ''
              }]
            }]
          },
          issuetype: {
            name: issueType || 'Task'
          },
          priority: {
            name: priority || 'Medium'
          }
        }
      };

      const response = await fetch(`${site_url}/rest/api/3/issue`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(issueData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Jira create issue error:', errorData);
        throw new Error(`Failed to create issue: ${response.status}`);
      }

      const createdIssue = await response.json();
      
      res.json({
        id: createdIssue.id,
        key: createdIssue.key,
        url: `${site_url}/browse/${createdIssue.key}`
      });
    } catch (error) {
      console.error('Error creating Jira issue:', error);
      res.status(500).json({ message: 'Failed to create issue' });
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

  // Jira remote link endpoints
  app.get('/jira/branch', async (req, res) => {
    try {
      const { issueKey } = req.query;
      
      if (!issueKey) {
        return res.status(400).json({ message: 'Issue key is required' });
      }

      // Redirect to QueryLinker frontend with Jira issue context
      const redirectUrl = `/incident/${issueKey}?action=create-branch`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error handling Jira branch creation:', error);
      res.status(500).json({ message: 'Failed to handle branch creation' });
    }
  });

  app.get('/jira/create-flag', async (req, res) => {
    try {
      const { issueKey } = req.query;
      
      if (!issueKey) {
        return res.status(400).json({ message: 'Issue key is required' });
      }

      // Redirect to QueryLinker frontend with feature flag creation context
      const redirectUrl = `/incident/${issueKey}?action=create-flag`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error handling Jira flag creation:', error);
      res.status(500).json({ message: 'Failed to handle flag creation' });
    }
  });

  app.get('/jira/link-flag', async (req, res) => {
    try {
      const { issueKey } = req.query;
      
      if (!issueKey) {
        return res.status(400).json({ message: 'Issue key is required' });
      }

      // Redirect to QueryLinker frontend with feature flag linking context
      const redirectUrl = `/incident/${issueKey}?action=link-flag`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error handling Jira flag linking:', error);
      res.status(500).json({ message: 'Failed to handle flag linking' });
    }
  });

  app.get('/jira/flags', async (req, res) => {
    try {
      const { issueKey } = req.query;
      
      if (!issueKey) {
        return res.status(400).json({ message: 'Issue key is required' });
      }

      // Redirect to QueryLinker frontend showing flags for this issue
      const redirectUrl = `/incident/${issueKey}?view=flags`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error handling Jira flags listing:', error);
      res.status(500).json({ message: 'Failed to list flags' });
    }
  });

  // Additional remote link endpoints
  app.get('/incident/:issueKey', async (req, res) => {
    try {
      const { issueKey } = req.params;
      const { action, view } = req.query;
      
      // This would typically redirect to the frontend incident management page
      // For now, serve a simple HTML page showing the context
      res.send(`
        <html>
          <head>
            <title>QueryLinker - Jira Issue ${issueKey}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
              .header { color: #0052cc; margin-bottom: 20px; }
              .info { background: #f4f5f7; padding: 15px; border-radius: 8px; margin: 10px 0; }
              .actions { margin-top: 20px; }
              .action { display: inline-block; margin: 5px; padding: 10px 15px; background: #0052cc; color: white; text-decoration: none; border-radius: 4px; }
            </style>
          </head>
          <body>
            <h1 class="header">QueryLinker Integration</h1>
            <div class="info">
              <strong>Jira Issue:</strong> ${issueKey}<br>
              ${action ? `<strong>Action:</strong> ${action}<br>` : ''}
              ${view ? `<strong>View:</strong> ${view}<br>` : ''}
            </div>
            <div class="actions">
              <a href="/search?q=${issueKey}" class="action">Search Knowledge Base</a>
              <a href="/sla/${issueKey}" class="action">View SLA Status</a>
              <a href="/analytics?filter=${issueKey}" class="action">System Analytics</a>
            </div>
            <p>This integration allows you to manage incidents, search knowledge bases, monitor SLAs, and view analytics for Jira issues directly from QueryLinker.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error handling Jira incident view:', error);
      res.status(500).json({ message: 'Failed to load incident view' });
    }
  });

  app.get('/sla/:issueKey', async (req, res) => {
    try {
      const { issueKey } = req.params;
      
      // Serve a basic SLA status page for the Jira issue
      res.send(`
        <html>
          <head>
            <title>SLA Status - ${issueKey}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
              .header { color: #0052cc; }
              .sla-box { background: #e3fcef; border-left: 4px solid #00875a; padding: 15px; margin: 10px 0; }
              .warning { background: #fff4e6; border-left: 4px solid #ff8b00; padding: 15px; margin: 10px 0; }
            </style>
          </head>
          <body>
            <h1 class="header">SLA Status for ${issueKey}</h1>
            <div class="sla-box">
              <strong>Response Time SLA:</strong> Met (2h 15m remaining)<br>
              <strong>Resolution Time SLA:</strong> On Track (1d 4h remaining)
            </div>
            <div class="warning">
              <strong>Note:</strong> This is a demo integration. Real SLA data would be calculated based on your Jira issue data and configured SLA targets.
            </div>
            <a href="/incident/${issueKey}">← Back to Issue</a>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error handling SLA view:', error);
      res.status(500).json({ message: 'Failed to load SLA status' });
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
