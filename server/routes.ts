import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
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
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Email/Password Authentication Routes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user
      const user = await storage.createEmailUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        authProvider: 'email',
      });

      // Remove password from response
      const { password: _, ...userResponse } = user;
      res.status(201).json({ user: userResponse, message: 'Account created successfully' });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Failed to create account' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Update last login
      await storage.updateUserLastLogin(user.id);

      // Set session
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        authProvider: 'email',
      };

      // Remove password from response
      const { password: _, ...userResponse } = user;
      res.json({ user: userResponse, message: 'Login successful' });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal whether email exists or not
        return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
      }

      // Generate reset token
      const resetToken = nanoid(32);
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now
      
      await storage.setPasswordResetToken(user.id, resetToken, resetExpires);
      
      // In a real app, you'd send an email here
      console.log(`Password reset token for ${email}: ${resetToken}`);
      
      res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Failed to process password reset request' });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }

      const user = await storage.getUserByResetToken(token);
      if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      // Update password and clear reset token
      await storage.updateUserPassword(user.id, hashedPassword);
      
      res.json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
    try {
      (req as any).session.destroy((err: any) => {
        if (err) {
          console.error('Session destroy error:', err);
          return res.status(500).json({ message: 'Failed to logout' });
        }
        res.json({ message: 'Logout successful' });
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Failed to logout' });
    }
  });

  // Get current user for email auth
  app.get('/api/auth/me', async (req, res) => {
    try {
      const session = (req as any).session;
      if (!session || !session.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      res.json({ user: session.user });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to get user' });
    }
  });

  // Dashboard metrics
  app.get('/api/dashboard/metrics', isAuthenticated, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // Systems management
  app.get('/api/systems', isAuthenticated, async (req, res) => {
    try {
      const systems = await storage.getSystems();
      res.json(systems);
    } catch (error) {
      console.error("Error fetching systems:", error);
      res.status(500).json({ message: "Failed to fetch systems" });
    }
  });

  app.post('/api/systems', isAuthenticated, async (req, res) => {
    try {
      const systemData = insertSystemSchema.parse(req.body);
      const system = await storage.createSystem(systemData);
      res.status(201).json(system);
    } catch (error) {
      console.error("Error creating system:", error);
      res.status(500).json({ message: "Failed to create system" });
    }
  });

  app.put('/api/systems/:id', isAuthenticated, async (req, res) => {
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

  app.post('/api/systems/:id/sync', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
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
  app.get('/api/solutions', isAuthenticated, async (req, res) => {
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

  app.get('/api/solutions/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const solution = await storage.getSolution(id);
      
      if (!solution) {
        return res.status(404).json({ message: "Solution not found" });
      }
      
      // Track interaction
      const userId = (req as any).user.claims.sub;
      await storage.createInteraction({
        userId,
        solutionId: id,
        action: 'view',
        metadata: { timestamp: new Date() }
      });
      
      res.json(solution);
    } catch (error) {
      console.error("Error fetching solution:", error);
      res.status(500).json({ message: "Failed to fetch solution" });
    }
  });

  // AI-powered search
  app.post('/api/search', isAuthenticated, async (req, res) => {
    try {
      const { query, systems: systemIds } = req.body;
      const userId = (req as any).user.claims.sub;
      
      if (!query || query.trim().length === 0) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const solutions = await storage.searchSolutions(query, systemIds);
      
      // Track search query
      await storage.createSearchQuery({
        userId,
        query: query.trim(),
        resultsCount: solutions.length,
        confidence: Math.floor(Math.random() * 20) + 80, // Mock confidence score
        systemsSearched: systemIds || [],
        metadata: { timestamp: new Date() }
      });
      
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

  app.get('/api/search/recent', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const recentSearches = await storage.getRecentSearches(userId, limit);
      res.json(recentSearches);
    } catch (error) {
      console.error("Error fetching recent searches:", error);
      res.status(500).json({ message: "Failed to fetch recent searches" });
    }
  });

  app.get('/api/search/popular', isAuthenticated, async (req, res) => {
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
  app.get('/api/sla/targets', isAuthenticated, async (req, res) => {
    try {
      const targets = await storage.getSLATargets();
      res.json(targets);
    } catch (error) {
      console.error("Error fetching SLA targets:", error);
      res.status(500).json({ message: "Failed to fetch SLA targets" });
    }
  });

  app.get('/api/sla/status', isAuthenticated, async (req, res) => {
    try {
      const status = await storage.getSLAStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching SLA status:", error);
      res.status(500).json({ message: "Failed to fetch SLA status" });
    }
  });

  // Notifications
  app.get('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      const unreadOnly = req.query.unread === 'true';
      
      const notifications = await storage.getUserNotifications(userId, unreadOnly);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
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
  app.get('/api/analytics/popular-solutions', isAuthenticated, async (req, res) => {
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
  app.post('/api/interactions', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;
      const interactionData = insertInteractionSchema.parse({
        ...req.body,
        userId
      });
      
      const interaction = await storage.createInteraction(interactionData);
      res.status(201).json(interaction);
    } catch (error) {
      console.error("Error creating interaction:", error);
      res.status(500).json({ message: "Failed to create interaction" });
    }
  });

  // Data sources management
  app.get('/api/data-sources', isAuthenticated, async (req, res) => {
    try {
      const dataSources = await storage.getDataSources();
      res.json(dataSources);
    } catch (error) {
      console.error("Error fetching data sources:", error);
      res.status(500).json({ message: "Failed to fetch data sources" });
    }
  });

  app.post('/api/data-sources', isAuthenticated, async (req, res) => {
    try {
      const dataSourceData = insertDataSourceSchema.parse(req.body);
      const dataSource = await storage.createDataSource(dataSourceData);
      res.status(201).json(dataSource);
    } catch (error) {
      console.error("Error creating data source:", error);
      res.status(500).json({ message: "Failed to create data source" });
    }
  });

  app.put('/api/data-sources/:id', isAuthenticated, async (req, res) => {
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

  app.post('/api/data-sources/:id/sync', isAuthenticated, async (req, res) => {
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
  app.get('/api/incidents', isAuthenticated, async (req, res) => {
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

  app.get('/api/incidents/active', isAuthenticated, async (req, res) => {
    try {
      const incidents = await storage.getActiveIncidents();
      res.json(incidents);
    } catch (error) {
      console.error("Error fetching active incidents:", error);
      res.status(500).json({ message: "Failed to fetch active incidents" });
    }
  });

  app.get('/api/incidents/status/:status', isAuthenticated, async (req, res) => {
    try {
      const { status } = req.params;
      const incidents = await storage.getIncidentsByStatus(status);
      res.json(incidents);
    } catch (error) {
      console.error("Error fetching incidents by status:", error);
      res.status(500).json({ message: "Failed to fetch incidents by status" });
    }
  });

  app.get('/api/incidents/severity/:severity', isAuthenticated, async (req, res) => {
    try {
      const { severity } = req.params;
      const incidents = await storage.getIncidentsBySeverity(severity);
      res.json(incidents);
    } catch (error) {
      console.error("Error fetching incidents by severity:", error);
      res.status(500).json({ message: "Failed to fetch incidents by severity" });
    }
  });

  app.get('/api/incidents/:id', isAuthenticated, async (req, res) => {
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

  app.get('/api/incidents/:id/updates', isAuthenticated, async (req, res) => {
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
  app.get('/api/service-components', isAuthenticated, async (req, res) => {
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
  app.get('/api/incident-metrics', isAuthenticated, async (req, res) => {
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

  // Trigger manual sync of all data sources
  app.post('/api/sync/all', isAuthenticated, async (req, res) => {
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
