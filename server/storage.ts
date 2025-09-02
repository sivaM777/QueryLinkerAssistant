import {
  users,
  systems,
  solutions,
  interactions,
  slaTargets,
  slaRecords,
  notifications,
  searchQueries,
  systemConfigurations,
  dataSources,
  incidents,
  incidentUpdates,
  serviceComponents,
  incidentMetrics,
  googleMeetings,
  googleTokens,
  type User,
  type UpsertUser,
  type System,
  type InsertSystem,
  type Solution,
  type InsertSolution,
  type Interaction,
  type InsertInteraction,
  type SLATarget,
  type InsertSLATarget,
  type SLARecord,
  type Notification,
  type InsertNotification,
  type SearchQuery,
  type InsertSearchQuery,
  type SystemConfiguration,
  type DataSource,
  type InsertDataSource,
  type Incident,
  type InsertIncident,
  type IncidentUpdate,
  type InsertIncidentUpdate,
  type ServiceComponent,
  type InsertServiceComponent,
  type IncidentMetric,
  type InsertIncidentMetric,
  type GoogleMeeting,
  type InsertGoogleMeeting,
  type GoogleToken,
  type InsertGoogleToken,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte, lte, like, ilike, or } from "drizzle-orm";
import fs from 'fs';
import path from 'path';

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Email/Password authentication operations
  getUserByEmail(email: string): Promise<User | undefined>;
  createEmailUser(userData: any): Promise<User>;
  updateUserLastLogin(id: string): Promise<void>;
  setPasswordResetToken(id: string, token: string, expires: Date): Promise<void>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  updateUserPassword(id: string, hashedPassword: string): Promise<void>;

  // System operations
  getSystems(): Promise<System[]>;
  getSystem(id: number): Promise<System | undefined>;
  createSystem(system: InsertSystem): Promise<System>;
  updateSystem(id: number, updates: Partial<InsertSystem>): Promise<System>;
  deleteSystem(id: number): Promise<boolean>;
  updateSystemSyncTime(id: number): Promise<void>;

  // Solution operations
  getSolutions(limit?: number, offset?: number): Promise<Solution[]>;
  getSolutionsBySystem(systemId: number): Promise<Solution[]>;
  searchSolutions(query: string, systems?: string[]): Promise<Solution[]>;
  getSolution(id: number): Promise<Solution | undefined>;
  createSolution(solution: InsertSolution): Promise<Solution>;
  updateSolution(id: number, updates: Partial<InsertSolution>): Promise<Solution>;
  deleteSolution(id: number): Promise<boolean>;

  // Interaction operations
  getUserInteractions(userId: string, limit?: number): Promise<Interaction[]>;
  createInteraction(interaction: InsertInteraction): Promise<Interaction>;
  getPopularSolutions(limit?: number): Promise<{ solution: Solution; interactionCount: number }[]>;

  // SLA operations
  getSLATargets(): Promise<SLATarget[]>;
  createSLATarget(target: InsertSLATarget): Promise<SLATarget>;
  getSLARecords(targetId?: number, limit?: number): Promise<SLARecord[]>;
  getSLAStatus(): Promise<{ target: SLATarget; records: SLARecord[] }[]>;

  // Notification operations
  getUserNotifications(userId: string, unreadOnly?: boolean): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<boolean>;

  // Search analytics
  createSearchQuery(query: InsertSearchQuery): Promise<SearchQuery>;
  getRecentSearches(userId: string, limit?: number): Promise<SearchQuery[]>;
  getPopularSearches(limit?: number): Promise<{ query: string; count: number }[]>;

  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    totalSolutions: number;
    activeSLAs: number;
    searchSuccessRate: number;
    activeUsers: number;
    systemsConnected: number;
    incidentsResolved: number;
    avgResolutionTime: string;
  }>;

  // System configurations
  getSystemConfiguration(systemId: number): Promise<SystemConfiguration | undefined>;
  updateSystemConfiguration(systemId: number, config: Partial<SystemConfiguration>): Promise<SystemConfiguration>;

  // Data sources for incident aggregation
  getDataSources(): Promise<DataSource[]>;
  getDataSource(id: number): Promise<DataSource | undefined>;
  createDataSource(dataSource: InsertDataSource): Promise<DataSource>;
  updateDataSource(id: number, updates: Partial<InsertDataSource>): Promise<DataSource>;
  updateDataSourceSyncTime(id: number, error?: string): Promise<void>;

  // Incidents management
  getIncidents(limit?: number, offset?: number): Promise<Incident[]>;
  getIncidentsByDataSource(dataSourceId: number): Promise<Incident[]>;
  getIncident(id: number): Promise<Incident | undefined>;
  createIncident(incident: InsertIncident): Promise<Incident>;
  updateIncident(id: number, updates: Partial<InsertIncident>): Promise<Incident>;
  upsertIncidentByExternalId(externalId: string, dataSourceId: number, incident: InsertIncident): Promise<Incident>;

  // Incident updates
  getIncidentUpdates(incidentId: number): Promise<IncidentUpdate[]>;
  createIncidentUpdate(update: InsertIncidentUpdate): Promise<IncidentUpdate>;

  // Service components
  getServiceComponents(dataSourceId?: number): Promise<ServiceComponent[]>;
  upsertServiceComponent(component: InsertServiceComponent): Promise<ServiceComponent>;

  // Incident metrics
  getIncidentMetrics(dataSourceId?: number, days?: number): Promise<IncidentMetric[]>;
  upsertIncidentMetric(metric: InsertIncidentMetric): Promise<IncidentMetric>;

  // Real-time incident aggregation
  getActiveIncidents(): Promise<Incident[]>;
  getIncidentsByStatus(status: string): Promise<Incident[]>;
  getIncidentsBySeverity(severity: string): Promise<Incident[]>;
  
  // Google Meet operations
  storeGoogleTokens(userId: string, tokenData: InsertGoogleToken): Promise<GoogleToken>;
  getGoogleTokens(userId: string): Promise<GoogleToken | undefined>;
  createGoogleMeeting(meeting: InsertGoogleMeeting): Promise<GoogleMeeting>;
  getGoogleMeeting(id: number): Promise<GoogleMeeting | undefined>;
  getUserGoogleMeetings(userId: string, limit?: number): Promise<GoogleMeeting[]>;
  updateGoogleMeeting(id: number, updates: Partial<InsertGoogleMeeting>): Promise<GoogleMeeting>;
  deleteGoogleMeeting(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Database error in getUser:', error);
      return undefined;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Email/Password authentication methods
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error('Database error in getUserByEmail:', error);
      return undefined;
    }
  }

  async createEmailUser(userData: any): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values({
          ...userData,
          id: undefined, // Let database generate UUID
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return user;
    } catch (error) {
      console.error('Database error in createEmailUser:', error);
      throw new Error('Failed to create user account');
    }
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async setPasswordResetCode(id: string, code: string, expires: Date): Promise<void> {
    await db
      .update(users)
      .set({
        passwordResetCode: code,
        passwordResetExpires: expires,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }


  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({
        password: hashedPassword,
        passwordResetCode: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  // System operations
  async getSystems(): Promise<System[]> {
    return await db.select().from(systems).orderBy(systems.name);
  }

  async getSystem(id: number): Promise<System | undefined> {
    const [system] = await db.select().from(systems).where(eq(systems.id, id));
    return system;
  }

  async createSystem(system: InsertSystem): Promise<System> {
    const [newSystem] = await db.insert(systems).values(system).returning();
    return newSystem;
  }

  async updateSystem(id: number, updates: Partial<InsertSystem>): Promise<System> {
    const [updatedSystem] = await db
      .update(systems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(systems.id, id))
      .returning();
    return updatedSystem;
  }

  async deleteSystem(id: number): Promise<boolean> {
    const result = await db.delete(systems).where(eq(systems.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async updateSystemSyncTime(id: number): Promise<void> {
    await db
      .update(systems)
      .set({ lastSyncAt: new Date(), updatedAt: new Date() })
      .where(eq(systems.id, id));
  }

  // Solution operations
  async getSolutions(limit = 50, offset = 0): Promise<Solution[]> {
    return await db
      .select()
      .from(solutions)
      .orderBy(desc(solutions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getSolutionsBySystem(systemId: number): Promise<Solution[]> {
    return await db
      .select()
      .from(solutions)
      .where(eq(solutions.systemId, systemId))
      .orderBy(desc(solutions.syncedAt));
  }

  async searchSolutions(query: string, systemIds?: string[]): Promise<Solution[]> {
    let searchCondition = or(
      ilike(solutions.title, `%${query}%`),
      ilike(solutions.content, `%${query}%`)
    );

    if (systemIds && systemIds.length > 0) {
      const systemIdNumbers = systemIds.map(id => parseInt(id));
      searchCondition = and(
        searchCondition,
        sql`${solutions.systemId} = ANY(${systemIdNumbers})`
      );
    }

    return await db
      .select()
      .from(solutions)
      .where(searchCondition)
      .orderBy(desc(solutions.updatedAt))
      .limit(100);
  }

  async getSolution(id: number): Promise<Solution | undefined> {
    const [solution] = await db.select().from(solutions).where(eq(solutions.id, id));
    return solution;
  }

  async createSolution(solution: InsertSolution): Promise<Solution> {
    const [newSolution] = await db.insert(solutions).values(solution).returning();
    return newSolution;
  }

  async updateSolution(id: number, updates: Partial<InsertSolution>): Promise<Solution> {
    const [updatedSolution] = await db
      .update(solutions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(solutions.id, id))
      .returning();
    return updatedSolution;
  }

  async deleteSolution(id: number): Promise<boolean> {
    const result = await db.delete(solutions).where(eq(solutions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteSolutionsBySystem(systemId: number): Promise<boolean> {
    const result = await db.delete(solutions).where(eq(solutions.systemId, systemId));
    return (result.rowCount ?? 0) > 0;
  }

  async createMockSolutionsForSystem(system: System): Promise<void> {
    const mockSolutions = this.generateMockSolutionsForSystemType(system);
    
    for (const solution of mockSolutions) {
      // Check if solution already exists to avoid duplicates
      const existing = await db
        .select()
        .from(solutions)
        .where(
          and(
            eq(solutions.systemId, system.id),
            eq(solutions.externalId, solution.externalId!)
          )
        );
      
      if (existing.length === 0) {
        await db.insert(solutions).values(solution);
      }
    }
  }

  private generateMockSolutionsForSystemType(system: System): InsertSolution[] {
    const baseSolutions = {
      jira: [
        {
          systemId: system.id,
          externalId: `JIRA-${Math.floor(Math.random() * 1000)}`,
          title: "How to configure Jira automation rules",
          content: "Step-by-step guide to setting up automation in Jira for issue management and workflow optimization.",
          url: `https://example-jira.atlassian.net/browse/HELP-${Math.floor(Math.random() * 100)}`,
          tags: ["jira", "automation", "workflow"],
          status: "active",
        },
        {
          systemId: system.id,
          externalId: `JIRA-${Math.floor(Math.random() * 1000)}`,
          title: "Jira permissions and user management",
          content: "Complete guide on managing user permissions, groups, and project access in Jira.",
          url: `https://example-jira.atlassian.net/browse/HELP-${Math.floor(Math.random() * 100)}`,
          tags: ["jira", "permissions", "users"],
          status: "active",
        },
        {
          systemId: system.id,
          externalId: `JIRA-${Math.floor(Math.random() * 1000)}`,
          title: "Custom fields and issue types setup",
          content: "How to create and configure custom fields and issue types for your Jira projects.",
          url: `https://example-jira.atlassian.net/browse/HELP-${Math.floor(Math.random() * 100)}`,
          tags: ["jira", "customization", "fields"],
          status: "active",
        },
      ],
      confluence: [
        {
          systemId: system.id,
          externalId: `CONF-${Math.floor(Math.random() * 1000)}`,
          title: "Confluence page templates and formatting",
          content: "Best practices for creating professional page templates and formatting content in Confluence.",
          url: `https://example.atlassian.net/wiki/spaces/HELP/pages/${Math.floor(Math.random() * 10000)}`,
          tags: ["confluence", "templates", "formatting"],
          status: "active",
        },
        {
          systemId: system.id,
          externalId: `CONF-${Math.floor(Math.random() * 1000)}`,
          title: "Space permissions and access control",
          content: "Managing space permissions and controlling access to Confluence content.",
          url: `https://example.atlassian.net/wiki/spaces/HELP/pages/${Math.floor(Math.random() * 10000)}`,
          tags: ["confluence", "permissions", "security"],
          status: "active",
        },
        {
          systemId: system.id,
          externalId: `CONF-${Math.floor(Math.random() * 1000)}`,
          title: "Confluence macros and advanced features",
          content: "Using macros, labels, and advanced features to enhance your Confluence pages.",
          url: `https://example.atlassian.net/wiki/spaces/HELP/pages/${Math.floor(Math.random() * 10000)}`,
          tags: ["confluence", "macros", "advanced"],
          status: "active",
        },
      ],
      github: [
        {
          systemId: system.id,
          externalId: `GH-${Math.floor(Math.random() * 1000)}`,
          title: "GitHub Actions workflow setup",
          content: "Creating and configuring GitHub Actions for CI/CD pipelines and automation.",
          url: `https://github.com/example/repo/issues/${Math.floor(Math.random() * 100)}`,
          tags: ["github", "actions", "ci-cd"],
          status: "active",
        },
        {
          systemId: system.id,
          externalId: `GH-${Math.floor(Math.random() * 1000)}`,
          title: "Branch protection and code review",
          content: "Setting up branch protection rules and implementing effective code review processes.",
          url: `https://github.com/example/repo/issues/${Math.floor(Math.random() * 100)}`,
          tags: ["github", "security", "review"],
          status: "active",
        },
        {
          systemId: system.id,
          externalId: `GH-${Math.floor(Math.random() * 1000)}`,
          title: "Issue templates and project management",
          content: "Creating issue templates and using GitHub Projects for better project organization.",
          url: `https://github.com/example/repo/issues/${Math.floor(Math.random() * 100)}`,
          tags: ["github", "issues", "project-management"],
          status: "active",
        },
      ],
      servicenow: [
        {
          systemId: system.id,
          externalId: `SN-${Math.floor(Math.random() * 1000)}`,
          title: "ServiceNow incident management workflow",
          content: "Best practices for incident management and resolution workflows in ServiceNow.",
          url: `https://example.service-now.com/kb_view.do?sysparm_article=KB${String(Math.floor(Math.random() * 100000)).padStart(7, '0')}`,
          tags: ["servicenow", "incident", "workflow"],
          status: "active",
        },
        {
          systemId: system.id,
          externalId: `SN-${Math.floor(Math.random() * 1000)}`,
          title: "Change management and approvals",
          content: "Managing change requests and approval processes in ServiceNow ITSM.",
          url: `https://example.service-now.com/kb_view.do?sysparm_article=KB${String(Math.floor(Math.random() * 100000)).padStart(7, '0')}`,
          tags: ["servicenow", "change-management", "approvals"],
          status: "active",
        },
        {
          systemId: system.id,
          externalId: `SN-${Math.floor(Math.random() * 1000)}`,
          title: "ServiceNow catalog and requests",
          content: "Setting up service catalog items and managing service requests efficiently.",
          url: `https://example.service-now.com/kb_view.do?sysparm_article=KB${String(Math.floor(Math.random() * 100000)).padStart(7, '0')}`,
          tags: ["servicenow", "catalog", "requests"],
          status: "active",
        },
      ],
      slack: [
        {
          systemId: system.id,
          externalId: `SLACK-${Math.floor(Math.random() * 1000)}`,
          title: "Slack bot configuration and automation",
          content: "Setting up Slack bots and workflow automations for team productivity.",
          url: `https://example.slack.com/archives/C${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          tags: ["slack", "bots", "automation"],
          status: "active",
        },
      ],
      googlemeet: [
        {
          systemId: system.id,
          externalId: `GOOGLEMEET-${Math.floor(Math.random() * 1000)}`,
          title: "Google Meet integration setup",
          content: "Configuring Google Meet integrations and managing video conferencing workflows.",
          url: `https://meet.google.com/lookup/${Math.random().toString(36).substr(2, 9)}`,
          tags: ["googlemeet", "integration", "meetings"],
          status: "active",
        },
      ],
      zendesk: [
        {
          systemId: system.id,
          externalId: `ZD-${Math.floor(Math.random() * 1000)}`,
          title: "Zendesk ticket management best practices",
          content: "Optimizing ticket handling and customer support workflows in Zendesk.",
          url: `https://example.zendesk.com/hc/en-us/articles/${Math.floor(Math.random() * 1000000000)}`,
          tags: ["zendesk", "tickets", "support"],
          status: "active",
        },
      ],
      linear: [
        {
          systemId: system.id,
          externalId: `LINEAR-${Math.floor(Math.random() * 1000)}`,
          title: "Linear project workflow optimization",
          content: "Setting up efficient project workflows and issue tracking in Linear.",
          url: `https://linear.app/example/issue/EX-${Math.floor(Math.random() * 100)}`,
          tags: ["linear", "workflow", "projects"],
          status: "active",
        },
      ],
      notion: [
        {
          systemId: system.id,
          externalId: `NOTION-${Math.floor(Math.random() * 1000)}`,
          title: "Notion workspace organization",
          content: "Best practices for organizing and structuring Notion workspaces for teams.",
          url: `https://www.notion.so/example/${Math.random().toString(36).substr(2, 9)}`,
          tags: ["notion", "organization", "workspace"],
          status: "active",
        },
      ],
    };

    const systemType = system.type.toLowerCase();
    return baseSolutions[systemType as keyof typeof baseSolutions] || [];
  }

  // Interaction operations
  async getUserInteractions(userId: string, limit = 50): Promise<Interaction[]> {
    return await db
      .select()
      .from(interactions)
      .where(eq(interactions.userId, userId))
      .orderBy(desc(interactions.timestamp))
      .limit(limit);
  }

  async createInteraction(interaction: InsertInteraction): Promise<Interaction> {
    const [newInteraction] = await db.insert(interactions).values(interaction).returning();
    return newInteraction;
  }

  async getPopularSolutions(limit = 10): Promise<{ solution: Solution; interactionCount: number }[]> {
    const result = await db
      .select({
        solution: solutions,
        interactionCount: sql<number>`count(${interactions.id})::int`,
      })
      .from(solutions)
      .leftJoin(interactions, eq(solutions.id, interactions.solutionId))
      .groupBy(solutions.id)
      .orderBy(desc(sql`count(${interactions.id})`))
      .limit(limit);

    return result;
  }

  // SLA operations
  async getSLATargets(): Promise<SLATarget[]> {
    return await db.select().from(slaTargets).where(eq(slaTargets.isActive, true));
  }

  async createSLATarget(target: InsertSLATarget): Promise<SLATarget> {
    const [newTarget] = await db.insert(slaTargets).values(target).returning();
    return newTarget;
  }

  async getSLARecords(targetId?: number, limit = 100): Promise<SLARecord[]> {
    if (targetId) {
      return await db.select().from(slaRecords)
        .where(eq(slaRecords.targetId, targetId))
        .orderBy(desc(slaRecords.recordedAt))
        .limit(limit);
    }

    return await db.select().from(slaRecords)
      .orderBy(desc(slaRecords.recordedAt))
      .limit(limit);
  }

  async getSLAStatus(): Promise<{ target: SLATarget; records: SLARecord[] }[]> {
    const targets = await this.getSLATargets();
    const result = [];

    for (const target of targets) {
      const records = await this.getSLARecords(target.id, 10);
      result.push({ target, records });
    }

    return result;
  }

  // Notification operations
  async getUserNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    if (unreadOnly) {
      return await db.select().from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
        .orderBy(desc(notifications.createdAt))
        .limit(50);
    }

    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationRead(id: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Search analytics
  async createSearchQuery(query: InsertSearchQuery): Promise<SearchQuery> {
    const [newQuery] = await db.insert(searchQueries).values(query).returning();
    return newQuery;
  }

  async getRecentSearches(userId: string, limit = 10): Promise<SearchQuery[]> {
    return await db
      .select()
      .from(searchQueries)
      .where(eq(searchQueries.userId, userId))
      .orderBy(desc(searchQueries.timestamp))
      .limit(limit);
  }

  async getPopularSearches(limit = 10): Promise<{ query: string; count: number }[]> {
    const result = await db
      .select({
        query: searchQueries.query,
        count: sql<number>`count(*)::int`,
      })
      .from(searchQueries)
      .groupBy(searchQueries.query)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);

    return result;
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<{
    totalSolutions: number;
    activeSLAs: number;
    searchSuccessRate: number;
    activeUsers: number;
    systemsConnected: number;
    incidentsResolved: number;
    avgResolutionTime: string;
  }> {
    const [solutionCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(solutions)
      .where(eq(solutions.status, 'active'));

    const [slaCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(slaTargets)
      .where(eq(slaTargets.isActive, true));

    const [userCount] = await db
      .select({ count: sql<number>`count(distinct ${interactions.userId})::int` })
      .from(interactions)
      .where(gte(interactions.timestamp, sql`NOW() - INTERVAL '24 hours'`));

    const [systemCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(systems)
      .where(eq(systems.isActive, true));

    // Mock some metrics for now - these would be calculated from real data
    const searchSuccessRate = 97.3;
    const incidentsResolved = 5;
    const avgResolutionTime = '21m';

    return {
      totalSolutions: solutionCount?.count || 0,
      activeSLAs: slaCount?.count || 0,
      searchSuccessRate,
      activeUsers: userCount?.count || 0,
      systemsConnected: systemCount?.count || 0,
      incidentsResolved,
      avgResolutionTime,
    };
  }

  // System configurations
  async getSystemConfiguration(systemId: number): Promise<SystemConfiguration | undefined> {
    const [config] = await db
      .select()
      .from(systemConfigurations)
      .where(eq(systemConfigurations.systemId, systemId));
    return config;
  }

  async updateSystemConfiguration(systemId: number, config: Partial<SystemConfiguration>): Promise<SystemConfiguration> {
    const [updatedConfig] = await db
      .insert(systemConfigurations)
      .values({ ...config, systemId })
      .onConflictDoUpdate({
        target: systemConfigurations.systemId,
        set: { ...config, lastConfigUpdate: new Date() },
      })
      .returning();
    return updatedConfig;
  }

  // Data sources operations
  async getDataSources(): Promise<DataSource[]> {
    return await db.select().from(dataSources).orderBy(dataSources.name);
  }

  async getDataSource(id: number): Promise<DataSource | undefined> {
    const [dataSource] = await db.select().from(dataSources).where(eq(dataSources.id, id));
    return dataSource;
  }

  async createDataSource(dataSource: InsertDataSource): Promise<DataSource> {
    const [newDataSource] = await db.insert(dataSources).values(dataSource).returning();
    return newDataSource;
  }

  async updateDataSource(id: number, updates: Partial<InsertDataSource>): Promise<DataSource> {
    const [updatedDataSource] = await db
      .update(dataSources)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dataSources.id, id))
      .returning();
    return updatedDataSource;
  }

  async updateDataSourceSyncTime(id: number, error?: string): Promise<void> {
    const updateData: any = {
      lastSyncAt: new Date(),
      updatedAt: new Date(),
      retryCount: error ? sql`${dataSources.retryCount} + 1` : 0,
    };

    if (error) {
      updateData.lastError = error;
    } else {
      updateData.lastError = null;
    }

    await db
      .update(dataSources)
      .set(updateData)
      .where(eq(dataSources.id, id));
  }

  // Incidents operations
  async getIncidents(limit = 50, offset = 0): Promise<Incident[]> {
    return await db
      .select()
      .from(incidents)
      .orderBy(desc(incidents.startedAt))
      .limit(limit)
      .offset(offset);
  }

  async getIncidentsByDataSource(dataSourceId: number): Promise<Incident[]> {
    return await db
      .select()
      .from(incidents)
      .where(eq(incidents.dataSourceId, dataSourceId))
      .orderBy(desc(incidents.startedAt));
  }

  async getIncident(id: number): Promise<Incident | undefined> {
    const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
    return incident;
  }

  async createIncident(incident: InsertIncident): Promise<Incident> {
    const [newIncident] = await db.insert(incidents).values(incident).returning();
    return newIncident;
  }

  async updateIncident(id: number, updates: Partial<InsertIncident>): Promise<Incident> {
    const [updatedIncident] = await db
      .update(incidents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(incidents.id, id))
      .returning();
    return updatedIncident;
  }

  async upsertIncidentByExternalId(externalId: string, dataSourceId: number, incident: InsertIncident): Promise<Incident> {
    const [upsertedIncident] = await db
      .insert(incidents)
      .values(incident)
      .onConflictDoUpdate({
        target: [incidents.externalId, incidents.dataSourceId],
        set: { ...incident, updatedAt: new Date(), syncedAt: new Date() },
      })
      .returning();
    return upsertedIncident;
  }

  // Incident updates operations
  async getIncidentUpdates(incidentId: number): Promise<IncidentUpdate[]> {
    return await db
      .select()
      .from(incidentUpdates)
      .where(eq(incidentUpdates.incidentId, incidentId))
      .orderBy(desc(incidentUpdates.timestamp));
  }

  async createIncidentUpdate(update: InsertIncidentUpdate): Promise<IncidentUpdate> {
    const [newUpdate] = await db.insert(incidentUpdates).values(update).returning();
    return newUpdate;
  }

  // Service components operations
  async getServiceComponents(dataSourceId?: number): Promise<ServiceComponent[]> {
    if (dataSourceId) {
      return await db.select().from(serviceComponents)
        .where(eq(serviceComponents.dataSourceId, dataSourceId))
        .orderBy(serviceComponents.position, serviceComponents.name);
    }

    return await db.select().from(serviceComponents)
      .orderBy(serviceComponents.position, serviceComponents.name);
  }

  async upsertServiceComponent(component: InsertServiceComponent): Promise<ServiceComponent> {
    const [upsertedComponent] = await db
      .insert(serviceComponents)
      .values(component)
      .onConflictDoUpdate({
        target: [serviceComponents.externalId, serviceComponents.dataSourceId],
        set: { ...component, updatedAt: new Date(), syncedAt: new Date() },
      })
      .returning();
    return upsertedComponent;
  }

  // Incident metrics operations
  async getIncidentMetrics(dataSourceId?: number, days = 30): Promise<IncidentMetric[]> {
    let query = db.select().from(incidentMetrics);
    
    const conditions = [gte(incidentMetrics.date, sql`NOW() - INTERVAL '${days} days'`)];
    
    if (dataSourceId) {
      conditions.push(eq(incidentMetrics.dataSourceId, dataSourceId));
    }

    return await query
      .where(and(...conditions))
      .orderBy(desc(incidentMetrics.date));
  }

  async upsertIncidentMetric(metric: InsertIncidentMetric): Promise<IncidentMetric> {
    const [upsertedMetric] = await db
      .insert(incidentMetrics)
      .values(metric)
      .onConflictDoUpdate({
        target: [incidentMetrics.date, incidentMetrics.dataSourceId],
        set: metric,
      })
      .returning();
    return upsertedMetric;
  }

  // Real-time incident queries
  async getActiveIncidents(): Promise<Incident[]> {
    return await db
      .select()
      .from(incidents)
      .where(and(
        eq(incidents.isActive, true),
        sql`${incidents.status} != 'resolved'`
      ))
      .orderBy(desc(incidents.startedAt));
  }

  async getIncidentsByStatus(status: string): Promise<Incident[]> {
    return await db
      .select()
      .from(incidents)
      .where(and(
        eq(incidents.status, status),
        eq(incidents.isActive, true)
      ))
      .orderBy(desc(incidents.startedAt));
  }

  async getIncidentsBySeverity(severity: string): Promise<Incident[]> {
    return await db
      .select()
      .from(incidents)
      .where(and(
        eq(incidents.severity, severity),
        eq(incidents.isActive, true)
      ))
      .orderBy(desc(incidents.startedAt));
  }
}

// In-memory storage for development fallback
class MemoryStorage implements IStorage {
  protected users: Map<string, User> = new Map();
  protected usersByEmail: Map<string, User> = new Map();
  protected systems: System[] = [];
  protected solutions: Solution[] = [];
  protected interactions: Interaction[] = [];
  protected slaTargets: SLATarget[] = [];
  protected slaRecords: SLARecord[] = [];
  protected notifications: Notification[] = [];
  protected searchQueries: SearchQuery[] = [];
  protected dataSources: DataSource[] = [];
  protected incidents: Incident[] = [];
  protected incidentUpdates: IncidentUpdate[] = [];
  protected serviceComponents: ServiceComponent[] = [];
  protected incidentMetrics: IncidentMetric[] = [];
  protected googleMeetings: GoogleMeeting[] = [];
  protected googleTokens: GoogleToken[] = [];
  protected idCounter = 1;

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id || '');
    if (existingUser) {
      const updatedUser = { ...existingUser, ...userData, updatedAt: new Date() };
      this.users.set(updatedUser.id, updatedUser);
      if (updatedUser.email) {
        this.usersByEmail.set(updatedUser.email, updatedUser);
      }
      return updatedUser;
    } else {
      const newUser: User = {
        id: userData.id || `user_${Date.now()}`,
        email: userData.email || null,
        password: userData.password || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        profileImageUrl: userData.profileImageUrl || null,
        role: userData.role || 'user',
        emailVerified: userData.emailVerified || false,
        passwordResetToken: userData.passwordResetToken || null,
        passwordResetExpires: userData.passwordResetExpires || null,
        lastLoginAt: userData.lastLoginAt || null,
        authProvider: userData.authProvider || 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(newUser.id, newUser);
      if (newUser.email) {
        this.usersByEmail.set(newUser.email, newUser);
      }
      return newUser;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.usersByEmail.get(email);
  }

  async createEmailUser(userData: any): Promise<User> {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newUser: User = {
      id: userId,
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      profileImageUrl: null,
      role: 'user',
      emailVerified: false,
      passwordResetToken: null,
      passwordResetExpires: null,
      lastLoginAt: null,
      authProvider: 'email',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userId, newUser);
    this.usersByEmail.set(userData.email, newUser);
    return newUser;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.lastLoginAt = new Date();
      user.updatedAt = new Date();
    }
  }

  async setPasswordResetToken(id: string, token: string, expires: Date): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.passwordResetToken = token;
      user.passwordResetExpires = expires;
      user.updatedAt = new Date();
    }
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.passwordResetToken === token);
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.password = hashedPassword;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      user.updatedAt = new Date();
    }
  }

  // Stub implementations for other methods
  async getSystems(): Promise<System[]> { return this.systems; }
  async getSystem(id: number): Promise<System | undefined> { return this.systems.find(s => s.id === id); }
  async createSystem(system: InsertSystem): Promise<System> { 
    const newSystem = { ...system, id: this.idCounter++, createdAt: new Date(), updatedAt: new Date() } as System;
    this.systems.push(newSystem);
    return newSystem;
  }
  async updateSystem(id: number, updates: Partial<InsertSystem>): Promise<System> { 
    const index = this.systems.findIndex(s => s.id === id);
    if (index >= 0) {
      this.systems[index] = { ...this.systems[index], ...updates, updatedAt: new Date() };
      return this.systems[index];
    }
    throw new Error('System not found');
  }
  async deleteSystem(id: number): Promise<boolean> { 
    const index = this.systems.findIndex(s => s.id === id);
    if (index >= 0) {
      this.systems.splice(index, 1);
      return true;
    }
    return false;
  }
  async updateSystemSyncTime(id: number): Promise<void> { 
    const system = this.systems.find(s => s.id === id);
    if (system) {
      system.lastSyncAt = new Date();
      system.updatedAt = new Date();
    }
  }

  async getSolutions(limit = 50, offset = 0): Promise<Solution[]> { return this.solutions.slice(offset, offset + limit); }
  async getSolutionsBySystem(systemId: number): Promise<Solution[]> { return this.solutions.filter(s => s.systemId === systemId); }
  async searchSolutions(query: string, systemIds?: string[]): Promise<Solution[]> { 
    return this.solutions.filter(s => 
      s.title?.toLowerCase().includes(query.toLowerCase()) || 
      s.content?.toLowerCase().includes(query.toLowerCase())
    );
  }
  async getSolution(id: number): Promise<Solution | undefined> { return this.solutions.find(s => s.id === id); }
  async createSolution(solution: InsertSolution): Promise<Solution> { 
    const newSolution = { ...solution, id: this.idCounter++, createdAt: new Date(), updatedAt: new Date() } as Solution;
    this.solutions.push(newSolution);
    return newSolution;
  }
  async updateSolution(id: number, updates: Partial<InsertSolution>): Promise<Solution> {
    const index = this.solutions.findIndex(s => s.id === id);
    if (index >= 0) {
      this.solutions[index] = { ...this.solutions[index], ...updates, updatedAt: new Date() };
      return this.solutions[index];
    }
    throw new Error('Solution not found');
  }
  async deleteSolution(id: number): Promise<boolean> {
    const index = this.solutions.findIndex(s => s.id === id);
    if (index >= 0) {
      this.solutions.splice(index, 1);
      return true;
    }
    return false;
  }

  async getUserInteractions(userId: string, limit = 50): Promise<Interaction[]> { 
    return this.interactions.filter(i => i.userId === userId).slice(0, limit);
  }
  async createInteraction(interaction: InsertInteraction): Promise<Interaction> { 
    const newInteraction = { ...interaction, id: this.idCounter++, timestamp: new Date() } as Interaction;
    this.interactions.push(newInteraction);
    return newInteraction;
  }
  async getPopularSolutions(limit = 10): Promise<{ solution: Solution; interactionCount: number }[]> { 
    return this.solutions.slice(0, limit).map(s => ({ solution: s, interactionCount: 0 }));
  }

  async getSLATargets(): Promise<SLATarget[]> { return this.slaTargets.filter(t => t.isActive); }
  async createSLATarget(target: InsertSLATarget): Promise<SLATarget> { 
    const newTarget = { ...target, id: this.idCounter++, createdAt: new Date(), updatedAt: new Date() } as SLATarget;
    this.slaTargets.push(newTarget);
    return newTarget;
  }
  async getSLARecords(targetId?: number, limit = 100): Promise<SLARecord[]> { 
    return this.slaRecords.filter(r => !targetId || r.targetId === targetId).slice(0, limit);
  }
  async getSLAStatus(): Promise<{ target: SLATarget; records: SLARecord[] }[]> { 
    return this.slaTargets.map(target => ({ target, records: this.slaRecords.filter(r => r.targetId === target.id) }));
  }

  async getUserNotifications(userId: string, unreadOnly = false): Promise<Notification[]> { 
    return this.notifications.filter(n => n.userId === userId && (!unreadOnly || !n.isRead));
  }
  async createNotification(notification: InsertNotification): Promise<Notification> { 
    const newNotification = { ...notification, id: this.idCounter++, createdAt: new Date() } as Notification;
    this.notifications.push(newNotification);
    return newNotification;
  }
  async markNotificationRead(id: number): Promise<boolean> { 
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.isRead = true;
      return true;
    }
    return false;
  }

  async createSearchQuery(query: InsertSearchQuery): Promise<SearchQuery> { 
    const newQuery = { ...query, id: this.idCounter++, timestamp: new Date() } as SearchQuery;
    this.searchQueries.push(newQuery);
    return newQuery;
  }
  async getRecentSearches(userId: string, limit = 10): Promise<SearchQuery[]> { 
    return this.searchQueries.filter(q => q.userId === userId).slice(0, limit);
  }
  async getPopularSearches(limit = 10): Promise<{ query: string; count: number }[]> { 
    return this.searchQueries.slice(0, limit).map(q => ({ query: q.query, count: 1 }));
  }

  async getDashboardMetrics(): Promise<{
    totalSolutions: number;
    activeSLAs: number;
    searchSuccessRate: number;
    activeUsers: number;
    systemsConnected: number;
    incidentsResolved: number;
    avgResolutionTime: string;
  }> {
    return {
      totalSolutions: this.solutions.length,
      activeSLAs: this.slaTargets.filter(t => t.isActive).length,
      searchSuccessRate: 97.3,
      activeUsers: this.users.size,
      systemsConnected: this.systems.filter(s => s.isActive).length,
      incidentsResolved: 5,
      avgResolutionTime: '21m',
    };
  }

  async getSystemConfiguration(systemId: number): Promise<SystemConfiguration | undefined> { return undefined; }
  async updateSystemConfiguration(systemId: number, config: Partial<SystemConfiguration>): Promise<SystemConfiguration> { 
    throw new Error('Not implemented in memory storage');
  }

  async getDataSources(): Promise<DataSource[]> { return this.dataSources; }
  async getDataSource(id: number): Promise<DataSource | undefined> { return this.dataSources.find(d => d.id === id); }
  async createDataSource(dataSource: InsertDataSource): Promise<DataSource> { 
    const newDataSource = { ...dataSource, id: this.idCounter++, createdAt: new Date(), updatedAt: new Date() } as DataSource;
    this.dataSources.push(newDataSource);
    return newDataSource;
  }
  async updateDataSource(id: number, updates: Partial<InsertDataSource>): Promise<DataSource> {
    const index = this.dataSources.findIndex(d => d.id === id);
    if (index >= 0) {
      this.dataSources[index] = { ...this.dataSources[index], ...updates, updatedAt: new Date() };
      return this.dataSources[index];
    }
    throw new Error('Data source not found');
  }
  async updateDataSourceSyncTime(id: number, error?: string): Promise<void> {
    const dataSource = this.dataSources.find(d => d.id === id);
    if (dataSource) {
      dataSource.lastSyncAt = new Date();
      dataSource.updatedAt = new Date();
      if (error) {
        dataSource.lastError = error;
        dataSource.retryCount = (dataSource.retryCount || 0) + 1;
      } else {
        dataSource.lastError = null;
        dataSource.retryCount = 0;
      }
    }
  }

  async getIncidents(limit = 50, offset = 0): Promise<Incident[]> { return this.incidents.slice(offset, offset + limit); }
  async getIncidentsByDataSource(dataSourceId: number): Promise<Incident[]> { 
    return this.incidents.filter(i => i.dataSourceId === dataSourceId);
  }
  async getIncident(id: number): Promise<Incident | undefined> { return this.incidents.find(i => i.id === id); }
  async createIncident(incident: InsertIncident): Promise<Incident> { 
    const newIncident = { ...incident, id: this.idCounter++, syncedAt: new Date() } as Incident;
    this.incidents.push(newIncident);
    return newIncident;
  }
  async updateIncident(id: number, updates: Partial<InsertIncident>): Promise<Incident> {
    const index = this.incidents.findIndex(i => i.id === id);
    if (index >= 0) {
      this.incidents[index] = { ...this.incidents[index], ...updates, updatedAt: new Date() };
      return this.incidents[index];
    }
    throw new Error('Incident not found');
  }
  async upsertIncidentByExternalId(externalId: string, dataSourceId: number, incident: InsertIncident): Promise<Incident> {
    const existing = this.incidents.find(i => i.externalId === externalId && i.dataSourceId === dataSourceId);
    if (existing) {
      return this.updateIncident(existing.id, incident);
    } else {
      return this.createIncident(incident);
    }
  }

  async getIncidentUpdates(incidentId: number): Promise<IncidentUpdate[]> { 
    return this.incidentUpdates.filter(u => u.incidentId === incidentId);
  }
  async createIncidentUpdate(update: InsertIncidentUpdate): Promise<IncidentUpdate> { 
    const newUpdate = { ...update, id: this.idCounter++, timestamp: new Date() } as IncidentUpdate;
    this.incidentUpdates.push(newUpdate);
    return newUpdate;
  }

  async getServiceComponents(dataSourceId?: number): Promise<ServiceComponent[]> { 
    return this.serviceComponents.filter(c => !dataSourceId || c.dataSourceId === dataSourceId);
  }
  async upsertServiceComponent(component: InsertServiceComponent): Promise<ServiceComponent> { 
    const existing = this.serviceComponents.find(c => 
      c.externalId === component.externalId && c.dataSourceId === component.dataSourceId
    );
    if (existing) {
      Object.assign(existing, component, { updatedAt: new Date(), syncedAt: new Date() });
      return existing;
    } else {
      const newComponent = { ...component, id: this.idCounter++, syncedAt: new Date() } as ServiceComponent;
      this.serviceComponents.push(newComponent);
      return newComponent;
    }
  }

  async getIncidentMetrics(dataSourceId?: number, days = 30): Promise<IncidentMetric[]> { 
    return this.incidentMetrics.filter(m => !dataSourceId || m.dataSourceId === dataSourceId);
  }
  async upsertIncidentMetric(metric: InsertIncidentMetric): Promise<IncidentMetric> { 
    const existing = this.incidentMetrics.find(m => 
      m.date === metric.date && m.dataSourceId === metric.dataSourceId
    );
    if (existing) {
      Object.assign(existing, metric);
      return existing;
    } else {
      const newMetric = { ...metric, id: this.idCounter++ } as IncidentMetric;
      this.incidentMetrics.push(newMetric);
      return newMetric;
    }
  }

  async getActiveIncidents(): Promise<Incident[]> { 
    return this.incidents.filter(i => i.isActive && i.status !== 'resolved');
  }
  async getIncidentsByStatus(status: string): Promise<Incident[]> { 
    return this.incidents.filter(i => i.status === status && i.isActive);
  }
  async getIncidentsBySeverity(severity: string): Promise<Incident[]> { 
    return this.incidents.filter(i => i.severity === severity && i.isActive);
  }

  // Google Meet operations
  async storeGoogleTokens(userId: string, tokenData: InsertGoogleToken): Promise<GoogleToken> {
    const existing = this.googleTokens.find(t => t.userId === userId);
    if (existing) {
      Object.assign(existing, tokenData, { updatedAt: new Date() });
      return existing;
    } else {
      const newToken: GoogleToken = {
        ...tokenData,
        id: this.idCounter++,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.googleTokens.push(newToken);
      return newToken;
    }
  }

  async getGoogleTokens(userId: string): Promise<GoogleToken | undefined> {
    return this.googleTokens.find(t => t.userId === userId);
  }

  async createGoogleMeeting(meeting: InsertGoogleMeeting): Promise<GoogleMeeting> {
    const newMeeting: GoogleMeeting = {
      ...meeting,
      id: this.idCounter++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.googleMeetings.push(newMeeting);
    return newMeeting;
  }

  async getGoogleMeeting(id: number): Promise<GoogleMeeting | undefined> {
    return this.googleMeetings.find(m => m.id === id);
  }

  async getUserGoogleMeetings(userId: string, limit = 10): Promise<GoogleMeeting[]> {
    return this.googleMeetings
      .filter(m => m.userId === userId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, limit);
  }

  async updateGoogleMeeting(id: number, updates: Partial<InsertGoogleMeeting>): Promise<GoogleMeeting> {
    const meeting = this.googleMeetings.find(m => m.id === id);
    if (!meeting) {
      throw new Error('Meeting not found');
    }
    Object.assign(meeting, updates, { updatedAt: new Date() });
    return meeting;
  }

  async deleteGoogleMeeting(id: number): Promise<boolean> {
    const index = this.googleMeetings.findIndex(m => m.id === id);
    if (index === -1) {
      return false;
    }
    this.googleMeetings.splice(index, 1);
    return true;
  }
}

// Enhanced persistent storage that mimics database behavior
class PersistentStorage extends MemoryStorage {
  private dataFile = './.local/itsm_data.json';

  constructor() {
    super();
    this.loadData();
    // Auto-save every 30 seconds
    setInterval(() => this.saveData(), 30000);
    // Save on process exit
    process.on('exit', () => this.saveData());
    process.on('SIGINT', () => {
      this.saveData();
      process.exit(0);
    });
  }

  private saveData() {
    try {
      const data = {
        users: Array.from(this.users.entries()),
        usersByEmail: Array.from(this.usersByEmail.entries()),
        systems: this.systems,
        solutions: this.solutions,
        interactions: this.interactions,
        slaTargets: this.slaTargets,
        slaRecords: this.slaRecords,
        notifications: this.notifications,
        searchQueries: this.searchQueries,
        dataSources: this.dataSources,
        incidents: this.incidents,
        incidentUpdates: this.incidentUpdates,
        serviceComponents: this.serviceComponents,
        incidentMetrics: this.incidentMetrics,
        googleMeetings: this.googleMeetings,
        googleTokens: this.googleTokens,
        idCounter: this.idCounter,
      };
      
      
      // Ensure directory exists
      const dir = path.dirname(this.dataFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
      console.log('✓ Database saved to persistent storage');
    } catch (error) {
      console.warn('Failed to save persistent data:', error);
    }
  }

  private loadData() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
        
        this.users = new Map(data.users || []);
        this.usersByEmail = new Map(data.usersByEmail || []);
        this.systems = data.systems || [];
        this.solutions = data.solutions || [];
        this.interactions = data.interactions || [];
        this.slaTargets = data.slaTargets || [];
        this.slaRecords = data.slaRecords || [];
        this.notifications = data.notifications || [];
        this.searchQueries = data.searchQueries || [];
        this.dataSources = data.dataSources || [];
        this.incidents = data.incidents || [];
        this.incidentUpdates = data.incidentUpdates || [];
        this.serviceComponents = data.serviceComponents || [];
        this.incidentMetrics = data.incidentMetrics || [];
        this.googleMeetings = data.googleMeetings || [];
        this.googleTokens = data.googleTokens || [];
        this.idCounter = data.idCounter || 1;
        
        console.log(`✓ Loaded database with ${this.users.size} users, ${this.systems.length} systems, ${this.solutions.length} solutions, ${this.incidents.length} incidents`);
      } else {
        console.log('✓ Starting with fresh database');
        this.initializeDefaultData();
      }
    } catch (error) {
      console.warn('Failed to load persistent data, starting fresh:', error);
      this.initializeDefaultData();
    }
  }

  private initializeDefaultData() {
    // Only initialize data if this is truly a fresh start
    // Don't automatically create systems as they should be added by user
    console.log('✓ Starting with fresh database - no default systems created');

    // Only initialize essential SLA data, no systems

    // Add some default SLA targets
    const defaultSLAs: SLATarget[] = [
      {
        id: this.idCounter++,
        name: 'Critical Issue Response',
        type: 'response_time',
        threshold: '15 minutes',
        isActive: true,
        escalationPolicy: {
          levels: [
            { delay: 15, action: 'notify_team_lead' },
            { delay: 30, action: 'notify_manager' }
          ]
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.idCounter++,
        name: 'High Priority Resolution',
        type: 'resolution_time',
        threshold: '4 hours',
        isActive: true,
        escalationPolicy: {
          levels: [
            { delay: 240, action: 'notify_senior_team' },
            { delay: 480, action: 'notify_director' }
          ]
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    this.slaTargets = defaultSLAs;
    console.log('✓ Initialized database with default SLA targets only');
  }
}

// Create storage instance - use persistent storage that acts like a database
const storage: IStorage = new PersistentStorage();
console.log('✓ Using persistent file-based database storage');

export { storage };
