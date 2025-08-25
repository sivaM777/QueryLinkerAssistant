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

export async function registerRoutes(app: Express): Promise<Server> {


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

      // First delete all solutions from this system
      await storage.deleteSolutionsBySystem(id);

      // Then delete the system
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
        // Delete solutions first
        await storage.deleteSolutionsBySystem(system.id);
        // Then delete the system
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
      
      // Create mock solutions based on system type
      await storage.createMockSolutionsForSystem(system);
      
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
