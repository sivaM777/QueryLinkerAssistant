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
} from "@shared/schema";

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

  const httpServer = createServer(app);

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

  return httpServer;
}
