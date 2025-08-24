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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte, lte, like, ilike, or } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
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
    let query = db.select().from(slaRecords);
    
    if (targetId) {
      query = query.where(eq(slaRecords.targetId, targetId));
    }

    return await query
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
    let query = db.select().from(notifications).where(eq(notifications.userId, userId));
    
    if (unreadOnly) {
      query = query.where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    }

    return await query.orderBy(desc(notifications.createdAt)).limit(50);
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
    return result.rowCount > 0;
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
}

export const storage = new DatabaseStorage();
