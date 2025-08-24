import { syncService } from './connectors';
import { storage } from './storage';

export class SyncScheduler {
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly defaultInterval = 5 * 60 * 1000; // 5 minutes

  async start(): Promise<void> {
    console.log('Starting sync scheduler...');
    
    // Initialize default data sources if none exist
    await this.initializeDefaultDataSources();
    
    // Run initial sync
    await syncService.syncAllDataSources();
    
    // Schedule periodic syncs
    this.syncInterval = setInterval(async () => {
      try {
        await syncService.syncAllDataSources();
      } catch (error) {
        console.error('Scheduled sync failed:', error);
      }
    }, this.defaultInterval);
    
    console.log(`Sync scheduler started with ${this.defaultInterval / 1000}s interval`);
  }

  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Sync scheduler stopped');
    }
  }

  private async initializeDefaultDataSources(): Promise<void> {
    try {
      const existingSources = await storage.getDataSources();
      
      if (existingSources.length === 0) {
        console.log('Initializing default data sources...');
        
        const defaultSources = [
          {
            name: 'GitHub Status',
            type: 'github-status',
            baseUrl: 'https://kctbh9vrtdwd.statuspage.io',
            syncInterval: 300, // 5 minutes
            isActive: true,
            metadata: {
              description: 'GitHub service status and incidents',
              publicPage: 'https://githubstatus.com',
            },
          },
          {
            name: 'Discord Status',
            type: 'statuspage',
            baseUrl: 'https://discordstatus.com',
            syncInterval: 300,
            isActive: true,
            metadata: {
              description: 'Discord service status and incidents',
              publicPage: 'https://discordstatus.com',
            },
          },
          {
            name: 'Slack Status',
            type: 'statuspage',
            baseUrl: 'https://status.slack.com',
            syncInterval: 300,
            isActive: true,
            metadata: {
              description: 'Slack service status and incidents',
              publicPage: 'https://status.slack.com',
            },
          },
          {
            name: 'Vercel Status',
            type: 'statuspage',
            baseUrl: 'https://www.vercel-status.com',
            syncInterval: 300,
            isActive: true,
            metadata: {
              description: 'Vercel platform status and incidents',
              publicPage: 'https://www.vercel-status.com',
            },
          },
          {
            name: 'Cloudflare Status',
            type: 'statuspage',
            baseUrl: 'https://www.cloudflarestatus.com',
            syncInterval: 300,
            isActive: true,
            metadata: {
              description: 'Cloudflare service status and incidents',
              publicPage: 'https://www.cloudflarestatus.com',
            },
          },
          {
            name: 'Azure Status',
            type: 'azure-status',
            baseUrl: 'https://status.azure.com',
            syncInterval: 600, // 10 minutes
            isActive: true,
            metadata: {
              description: 'Microsoft Azure service status and incidents',
              publicPage: 'https://status.azure.com',
            },
          },
        ];

        for (const source of defaultSources) {
          try {
            await storage.createDataSource(source);
            console.log(`Created data source: ${source.name}`);
          } catch (error) {
            console.error(`Failed to create data source ${source.name}:`, error);
          }
        }
        
        console.log('Default data sources initialized');
      }
    } catch (error) {
      console.error('Error initializing default data sources:', error);
    }
  }
}

export const syncScheduler = new SyncScheduler();