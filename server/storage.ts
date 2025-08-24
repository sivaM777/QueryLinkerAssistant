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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte, lte, like, ilike, or } from "drizzle-orm";

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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
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
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createEmailUser(userData: any): Promise<User> {
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

  async setPasswordResetToken(id: string, token: string, expires: Date): Promise<void> {
    await db
      .update(users)
      .set({
        passwordResetToken: token,
        passwordResetExpires: expires,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, token));
    return user;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({
        password: hashedPassword,
        passwordResetToken: null,
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

export const storage = new DatabaseStorage();
