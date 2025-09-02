import axios from 'axios';
import { storage } from './storage';
import type { DataSource, InsertIncident, InsertServiceComponent, InsertIncidentUpdate } from '@shared/schema';

export interface ConnectorConfig {
  dataSource: DataSource;
  lastSyncTime?: Date;
}

export abstract class BaseConnector {
  protected config: ConnectorConfig;
  
  constructor(config: ConnectorConfig) {
    this.config = config;
  }

  abstract fetchIncidents(): Promise<InsertIncident[]>;
  abstract fetchComponents(): Promise<InsertServiceComponent[]>;
  abstract fetchIncidentUpdates(incidentId: string): Promise<InsertIncidentUpdate[]>;
  
  protected async makeRequest(url: string, headers: Record<string, string> = {}) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'QueryLinker/1.0',
          ...headers,
        },
        timeout: 30000,
      });
      return response.data;
    } catch (error) {
      console.error(`API request failed for ${url}:`, error);
      throw error;
    }
  }
}

// StatusPage.io connector for public status pages
export class StatusPageConnector extends BaseConnector {
  async fetchIncidents(): Promise<InsertIncident[]> {
    const { baseUrl } = this.config.dataSource;
    const data = await this.makeRequest(`${baseUrl}/api/v2/incidents.json`);
    
    return data.incidents.map((incident: any) => ({
      externalId: incident.id,
      dataSourceId: this.config.dataSource.id,
      systemName: incident.name || 'StatusPage Incident',
      title: incident.name,
      description: incident.incident_updates[0]?.body || '',
      status: this.mapStatus(incident.status),
      severity: this.mapSeverity(incident.impact),
      impact: incident.impact,
      startedAt: new Date(incident.created_at),
      resolvedAt: incident.resolved_at ? new Date(incident.resolved_at) : null,
      updatedAt: new Date(incident.updated_at),
      externalUrl: incident.shortlink,
      affectedServices: incident.components?.map((c: any) => c.name) || [],
      tags: [incident.impact, incident.status],
      metadata: {
        source: 'statuspage',
        monitoring: incident.monitoring_at,
        resolving: incident.resolving_at,
        componentIds: incident.component_ids,
      },
    }));
  }

  async fetchComponents(): Promise<InsertServiceComponent[]> {
    const { baseUrl } = this.config.dataSource;
    const data = await this.makeRequest(`${baseUrl}/api/v2/components.json`);
    
    return data.components.map((component: any) => ({
      dataSourceId: this.config.dataSource.id,
      externalId: component.id,
      name: component.name,
      description: component.description,
      status: component.status,
      group: component.group,
      position: component.position,
      showUptime: component.showcase,
      metadata: {
        source: 'statuspage',
        onlyShowIfDegraded: component.only_show_if_degraded,
      },
    }));
  }

  async fetchIncidentUpdates(incidentId: string): Promise<InsertIncidentUpdate[]> {
    const { baseUrl } = this.config.dataSource;
    const data = await this.makeRequest(`${baseUrl}/api/v2/incidents/${incidentId}.json`);
    
    return data.incident.incident_updates.map((update: any) => ({
      incidentId: parseInt(incidentId),
      updateType: 'status_change',
      newStatus: this.mapStatus(update.status),
      message: update.body,
      timestamp: new Date(update.created_at),
      metadata: {
        source: 'statuspage',
        updateId: update.id,
        displayAt: update.display_at,
      },
    }));
  }

  private mapStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'investigating': 'investigating',
      'identified': 'identified', 
      'monitoring': 'monitoring',
      'resolved': 'resolved',
      'postmortem': 'resolved',
    };
    return statusMap[status] || status;
  }

  private mapSeverity(impact: string): string {
    const severityMap: Record<string, string> = {
      'critical': 'critical',
      'major': 'high',
      'minor': 'medium',
      'none': 'low',
    };
    return severityMap[impact] || 'medium';
  }
}

// GitHub Status connector for GitHub's status page
export class GitHubStatusConnector extends BaseConnector {
  async fetchIncidents(): Promise<InsertIncident[]> {
    const data = await this.makeRequest('https://kctbh9vrtdwd.statuspage.io/api/v2/incidents.json');
    
    return data.incidents.map((incident: any) => ({
      externalId: incident.id,
      dataSourceId: this.config.dataSource.id,
      systemName: 'GitHub',
      title: incident.name,
      description: incident.incident_updates[0]?.body || '',
      status: this.mapStatus(incident.status),
      severity: this.mapSeverity(incident.impact),
      impact: incident.impact,
      startedAt: new Date(incident.created_at),
      resolvedAt: incident.resolved_at ? new Date(incident.resolved_at) : null,
      updatedAt: new Date(incident.updated_at),
      externalUrl: incident.shortlink,
      affectedServices: incident.components?.map((c: any) => c.name) || [],
      tags: ['github', incident.impact, incident.status],
      metadata: {
        source: 'github-status',
        incidentId: incident.id,
      },
    }));
  }

  async fetchComponents(): Promise<InsertServiceComponent[]> {
    const data = await this.makeRequest('https://kctbh9vrtdwd.statuspage.io/api/v2/components.json');
    
    return data.components.map((component: any) => ({
      dataSourceId: this.config.dataSource.id,
      externalId: component.id,
      name: component.name,
      description: component.description,
      status: component.status,
      group: component.group_id ? 'GitHub Services' : null,
      position: component.position,
      showUptime: component.showcase,
      metadata: {
        source: 'github-status',
        componentId: component.id,
      },
    }));
  }

  async fetchIncidentUpdates(incidentId: string): Promise<InsertIncidentUpdate[]> {
    return []; // GitHub provides updates within incidents
  }

  private mapStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'investigating': 'investigating',
      'identified': 'identified',
      'monitoring': 'monitoring', 
      'resolved': 'resolved',
    };
    return statusMap[status] || status;
  }

  private mapSeverity(impact: string): string {
    const severityMap: Record<string, string> = {
      'critical': 'critical',
      'major': 'high',
      'minor': 'medium',
      'none': 'low',
    };
    return severityMap[impact] || 'medium';
  }
}

// Azure Status connector
export class AzureStatusConnector extends BaseConnector {
  async fetchIncidents(): Promise<InsertIncident[]> {
    const data = await this.makeRequest('https://status.azure.com/api/v2/status.json');
    
    return data.issues?.map((issue: any) => ({
      externalId: issue.id,
      dataSourceId: this.config.dataSource.id,
      systemName: 'Microsoft Azure',
      title: issue.title,
      description: issue.summary,
      status: this.mapStatus(issue.status),
      severity: this.mapSeverity(issue.severity),
      impact: issue.severity,
      startedAt: new Date(issue.startTime),
      resolvedAt: issue.endTime ? new Date(issue.endTime) : null,
      updatedAt: new Date(issue.lastUpdateTime),
      externalUrl: issue.link,
      affectedServices: issue.services || [],
      tags: ['azure', issue.severity],
      metadata: {
        source: 'azure-status',
        issueId: issue.id,
        region: issue.region,
      },
    })) || [];
  }

  async fetchComponents(): Promise<InsertServiceComponent[]> {
    const data = await this.makeRequest('https://status.azure.com/api/v2/status.json');
    
    return data.services?.map((service: any, index: number) => ({
      dataSourceId: this.config.dataSource.id,
      externalId: service.id || service.name,
      name: service.name,
      description: service.displayName,
      status: service.health || 'operational',
      group: 'Azure Services',
      position: index,
      showUptime: true,
      metadata: {
        source: 'azure-status',
        serviceId: service.id,
      },
    })) || [];
  }

  async fetchIncidentUpdates(incidentId: string): Promise<InsertIncidentUpdate[]> {
    return [];
  }

  private mapStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'Active': 'investigating',
      'Resolved': 'resolved',
      'Information': 'monitoring',
    };
    return statusMap[status] || 'investigating';
  }

  private mapSeverity(severity: string): string {
    const severityMap: Record<string, string> = {
      'Error': 'critical',
      'Warning': 'high',
      'Information': 'medium',
    };
    return severityMap[severity] || 'medium';
  }
}

// Jira connector for issue tracking
export class JiraConnector extends BaseConnector {
  private get jiraBaseUrl(): string {
    return this.config.dataSource.baseUrl;
  }

  private get oauthConfig(): any {
    return this.config.dataSource.oauthConfig;
  }

  async fetchIncidents(): Promise<InsertIncident[]> {
    if (!this.oauthConfig?.access_token) {
      throw new Error('Jira OAuth token not found');
    }

    const jql = 'project in (projectsWhereUserHasPermission("BROWSE_PROJECTS")) AND status != Done ORDER BY updated DESC';
    const url = `${this.jiraBaseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=100`;
    
    const data = await this.makeRequest(url, {
      'Authorization': `Bearer ${this.oauthConfig.access_token}`,
      'Accept': 'application/json',
    });

    return data.issues?.map((issue: any) => ({
      externalId: issue.id,
      dataSourceId: this.config.dataSource.id,
      systemName: 'Jira',
      title: issue.fields.summary,
      description: issue.fields.description || '',
      status: this.mapStatus(issue.fields.status.name),
      severity: this.mapSeverity(issue.fields.priority?.name || 'Medium'),
      impact: this.mapImpact(issue.fields.priority?.name || 'Medium'),
      startedAt: new Date(issue.fields.created),
      resolvedAt: issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate) : null,
      updatedAt: new Date(issue.fields.updated),
      externalUrl: `${this.jiraBaseUrl}/browse/${issue.key}`,
      affectedServices: [issue.fields.project.name],
      tags: ['jira', issue.fields.issuetype.name, issue.fields.status.name],
      metadata: {
        source: 'jira',
        issueKey: issue.key,
        projectKey: issue.fields.project.key,
        issueType: issue.fields.issuetype.name,
        reporter: issue.fields.reporter?.displayName,
        assignee: issue.fields.assignee?.displayName,
      },
    })) || [];
  }

  async fetchComponents(): Promise<InsertServiceComponent[]> {
    if (!this.oauthConfig?.access_token) {
      throw new Error('Jira OAuth token not found');
    }

    const url = `${this.jiraBaseUrl}/rest/api/3/project`;
    
    const data = await this.makeRequest(url, {
      'Authorization': `Bearer ${this.oauthConfig.access_token}`,
      'Accept': 'application/json',
    });

    return data?.map((project: any, index: number) => ({
      dataSourceId: this.config.dataSource.id,
      externalId: project.id,
      name: project.name,
      description: project.description || `Jira project: ${project.key}`,
      status: 'operational',
      group: 'Jira Projects',
      position: index,
      showUptime: false,
      metadata: {
        source: 'jira',
        projectKey: project.key,
        projectType: project.projectTypeKey,
      },
    })) || [];
  }

  async fetchIncidentUpdates(incidentId: string): Promise<InsertIncidentUpdate[]> {
    if (!this.oauthConfig?.access_token) {
      throw new Error('Jira OAuth token not found');
    }

    const url = `${this.jiraBaseUrl}/rest/api/3/issue/${incidentId}/changelog`;
    
    try {
      const data = await this.makeRequest(url, {
        'Authorization': `Bearer ${this.oauthConfig.access_token}`,
        'Accept': 'application/json',
      });

      return data.values?.map((change: any) => ({
        incidentId: parseInt(incidentId),
        updateType: 'status_change',
        previousStatus: change.items.find((item: any) => item.field === 'status')?.fromString,
        newStatus: this.mapStatus(change.items.find((item: any) => item.field === 'status')?.toString || ''),
        message: `Updated by ${change.author.displayName}`,
        timestamp: new Date(change.created),
        metadata: {
          source: 'jira',
          changeId: change.id,
          author: change.author.displayName,
          items: change.items,
        },
      })) || [];
    } catch (error) {
      console.error(`Error fetching Jira issue updates for ${incidentId}:`, error);
      return [];
    }
  }

  private mapStatus(jiraStatus: string): string {
    const statusMap: Record<string, string> = {
      'To Do': 'investigating',
      'In Progress': 'investigating',
      'Done': 'resolved',
      'Open': 'investigating',
      'In Review': 'monitoring',
      'Resolved': 'resolved',
      'Closed': 'resolved',
      'Blocked': 'identified',
    };
    return statusMap[jiraStatus] || 'investigating';
  }

  private mapSeverity(jiraPriority: string): string {
    const severityMap: Record<string, string> = {
      'Highest': 'critical',
      'High': 'high',
      'Medium': 'medium',
      'Low': 'low',
      'Lowest': 'low',
      'Critical': 'critical',
      'Major': 'high',
      'Minor': 'medium',
      'Trivial': 'low',
    };
    return severityMap[jiraPriority] || 'medium';
  }

  private mapImpact(jiraPriority: string): string {
    const impactMap: Record<string, string> = {
      'Highest': 'major_outage',
      'High': 'partial_outage',
      'Medium': 'degraded_performance',
      'Low': 'operational',
      'Lowest': 'operational',
      'Critical': 'major_outage',
      'Major': 'partial_outage',
      'Minor': 'degraded_performance',
      'Trivial': 'operational',
    };
    return impactMap[jiraPriority] || 'operational';
  }
}

// Factory for creating connectors
export class ConnectorFactory {
  static createConnector(dataSource: DataSource): BaseConnector {
    const config: ConnectorConfig = { dataSource };
    
    switch (dataSource.type) {
      case 'statuspage':
        return new StatusPageConnector(config);
      case 'github-status':
        return new GitHubStatusConnector(config);
      case 'azure-status':
        return new AzureStatusConnector(config);
      case 'jira':
        return new JiraConnector(config);
      default:
        throw new Error(`Unsupported connector type: ${dataSource.type}`);
    }
  }
}

// Sync service for aggregating data from all sources
export class IncidentSyncService {
  async syncAllDataSources(): Promise<void> {
    try {
      const dataSources = await storage.getDataSources();
      const activeSources = dataSources.filter(ds => ds.isActive);
      
      console.log(`Syncing ${activeSources.length} active data sources...`);
      
      for (const dataSource of activeSources) {
        try {
          await this.syncDataSource(dataSource);
          await storage.updateDataSourceSyncTime(dataSource.id);
        } catch (error) {
          console.error(`Failed to sync data source ${dataSource.name}:`, error);
          await storage.updateDataSourceSyncTime(dataSource.id, error instanceof Error ? error.message : String(error));
        }
      }
      
      console.log('Data source sync completed');
    } catch (error) {
      console.error('Error during data source sync:', error);
    }
  }

  private async syncDataSource(dataSource: DataSource): Promise<void> {
    console.log(`Syncing data source: ${dataSource.name} (${dataSource.type})`);
    
    const connector = ConnectorFactory.createConnector(dataSource);
    
    // Sync incidents
    const incidents = await connector.fetchIncidents();
    console.log(`Found ${incidents.length} incidents for ${dataSource.name}`);
    
    for (const incident of incidents) {
      await storage.upsertIncidentByExternalId(incident.externalId, dataSource.id, incident);
    }
    
    // Sync components
    const components = await connector.fetchComponents();
    console.log(`Found ${components.length} components for ${dataSource.name}`);
    
    for (const component of components) {
      await storage.upsertServiceComponent(component);
    }
  }
}

// Global sync service instance
export const syncService = new IncidentSyncService();