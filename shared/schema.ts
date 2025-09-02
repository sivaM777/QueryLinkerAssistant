import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  serial,
  interval,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"), // For email/password auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default('user'),
  emailVerified: boolean("email_verified").default(false),
  passwordResetCode: varchar("password_reset_code", { length: 6 }),
  passwordResetExpires: timestamp("password_reset_expires"),
  lastLoginAt: timestamp("last_login_at"),
  authProvider: varchar("auth_provider").default('email'), // email, google, apple, replit
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Systems table for external integrations
export const systems = pgTable("systems", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // jira, confluence, github, servicenow
  config: jsonb("config"),
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Solutions table for knowledge base
export const solutions = pgTable("solutions", {
  id: serial("id").primaryKey(),
  systemId: integer("system_id").references(() => systems.id),
  externalId: varchar("external_id"),
  title: text("title").notNull(),
  content: text("content"),
  metadata: jsonb("metadata"),
  url: text("url"),
  tags: varchar("tags").array(),
  status: varchar("status").default('active'),
  syncedAt: timestamp("synced_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User interactions tracking
export const interactions = pgTable("interactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  solutionId: integer("solution_id").references(() => solutions.id),
  action: varchar("action", { length: 100 }).notNull(), // view, search, link, favorite
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// SLA targets configuration
export const slaTargets = pgTable("sla_targets", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // response_time, resolution_time, escalation_time
  threshold: interval("threshold").notNull(),
  escalationPolicy: jsonb("escalation_policy"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SLA monitoring records
export const slaRecords = pgTable("sla_records", {
  id: serial("id").primaryKey(),
  targetId: integer("target_id").references(() => slaTargets.id),
  ticketId: varchar("ticket_id"),
  systemId: integer("system_id").references(() => systems.id),
  actualTime: interval("actual_time"),
  status: varchar("status").notNull(), // met, breached, at_risk
  metadata: jsonb("metadata"),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// System configurations for OAuth and sync settings
export const systemConfigurations = pgTable("system_configurations", {
  id: serial("id").primaryKey(),
  systemId: integer("system_id").references(() => systems.id),
  oauthCredentials: jsonb("oauth_credentials"),
  syncInterval: integer("sync_interval"), // in minutes
  lastConfigUpdate: timestamp("last_config_update").defaultNow(),
});

// Cache entries for performance
export const cacheEntries = pgTable("cache_entries", {
  id: serial("id").primaryKey(),
  key: varchar("key").unique().notNull(),
  value: jsonb("value"),
  ttl: timestamp("ttl"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type", { length: 100 }).notNull(),
  title: varchar("title").notNull(),
  content: jsonb("content"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Search queries for analytics
export const searchQueries = pgTable("search_queries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  query: text("query").notNull(),
  resultsCount: integer("results_count"),
  confidence: integer("confidence"), // 0-100
  systemsSearched: varchar("systems_searched").array(),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// External data sources for IT service aggregation
export const dataSources = pgTable("data_sources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // statuspage, jira, servicenow, azure, etc
  baseUrl: text("base_url").notNull(),
  apiKey: text("api_key"), // encrypted
  oauthConfig: jsonb("oauth_config"),
  syncInterval: integer("sync_interval").default(300), // seconds
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  nextSyncAt: timestamp("next_sync_at"),
  retryCount: integer("retry_count").default(0),
  lastError: text("last_error"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// IT service incidents aggregated from external sources
export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  externalId: varchar("external_id").notNull(),
  dataSourceId: integer("data_source_id").references(() => dataSources.id),
  systemName: varchar("system_name", { length: 200 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull(), // investigating, identified, monitoring, resolved
  severity: varchar("severity", { length: 20 }), // critical, high, medium, low
  impact: varchar("impact", { length: 50 }), // operational, degraded_performance, partial_outage, major_outage
  startedAt: timestamp("started_at"),
  resolvedAt: timestamp("resolved_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
  externalUrl: text("external_url"),
  affectedServices: varchar("affected_services").array(),
  tags: varchar("tags").array(),
  metadata: jsonb("metadata"),
  syncedAt: timestamp("synced_at").defaultNow(),
  isActive: boolean("is_active").default(true),
}, (table) => [
  index("idx_incidents_external_source").on(table.externalId, table.dataSourceId),
  index("idx_incidents_status").on(table.status),
  index("idx_incidents_severity").on(table.severity),
  index("idx_incidents_system").on(table.systemName),
  index("idx_incidents_started_at").on(table.startedAt),
]);

// Incident updates/timeline for tracking changes
export const incidentUpdates = pgTable("incident_updates", {
  id: serial("id").primaryKey(),
  incidentId: integer("incident_id").references(() => incidents.id),
  updateType: varchar("update_type", { length: 50 }).notNull(), // status_change, new_update, resolved
  previousStatus: varchar("previous_status", { length: 50 }),
  newStatus: varchar("new_status", { length: 50 }),
  message: text("message"),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata"),
}, (table) => [
  index("idx_incident_updates_incident").on(table.incidentId),
  index("idx_incident_updates_timestamp").on(table.timestamp),
]);

// Service components and their status
export const serviceComponents = pgTable("service_components", {
  id: serial("id").primaryKey(),
  dataSourceId: integer("data_source_id").references(() => dataSources.id),
  externalId: varchar("external_id"),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull(), // operational, degraded, partial_outage, major_outage
  group: varchar("group", { length: 100 }),
  position: integer("position"),
  showUptime: boolean("show_uptime").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
  syncedAt: timestamp("synced_at").defaultNow(),
  metadata: jsonb("metadata"),
}, (table) => [
  index("idx_service_components_source").on(table.dataSourceId),
  index("idx_service_components_status").on(table.status),
]);

// Real-time incident metrics for dashboards
export const incidentMetrics = pgTable("incident_metrics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  dataSourceId: integer("data_source_id").references(() => dataSources.id),
  totalIncidents: integer("total_incidents").default(0),
  resolvedIncidents: integer("resolved_incidents").default(0),
  criticalIncidents: integer("critical_incidents").default(0),
  highIncidents: integer("high_incidents").default(0),
  averageResolutionTime: integer("avg_resolution_time"), // minutes
  uptimePercentage: integer("uptime_percentage"), // 0-10000 (for 2 decimal precision)
  metadata: jsonb("metadata"),
}, (table) => [
  index("idx_incident_metrics_date").on(table.date),
  index("idx_incident_metrics_source").on(table.dataSourceId),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  interactions: many(interactions),
  notifications: many(notifications),
  searchQueries: many(searchQueries),
}));

export const systemsRelations = relations(systems, ({ many, one }) => ({
  solutions: many(solutions),
  slaRecords: many(slaRecords),
  configuration: one(systemConfigurations),
}));

export const solutionsRelations = relations(solutions, ({ one, many }) => ({
  system: one(systems, {
    fields: [solutions.systemId],
    references: [systems.id],
  }),
  interactions: many(interactions),
}));

export const interactionsRelations = relations(interactions, ({ one }) => ({
  user: one(users, {
    fields: [interactions.userId],
    references: [users.id],
  }),
  solution: one(solutions, {
    fields: [interactions.solutionId],
    references: [solutions.id],
  }),
}));

export const slaTargetsRelations = relations(slaTargets, ({ many }) => ({
  records: many(slaRecords),
}));

export const slaRecordsRelations = relations(slaRecords, ({ one }) => ({
  target: one(slaTargets, {
    fields: [slaRecords.targetId],
    references: [slaTargets.id],
  }),
  system: one(systems, {
    fields: [slaRecords.systemId],
    references: [systems.id],
  }),
}));

export const systemConfigurationsRelations = relations(systemConfigurations, ({ one }) => ({
  system: one(systems, {
    fields: [systemConfigurations.systemId],
    references: [systems.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const searchQueriesRelations = relations(searchQueries, ({ one }) => ({
  user: one(users, {
    fields: [searchQueries.userId],
    references: [users.id],
  }),
}));

export const dataSourcesRelations = relations(dataSources, ({ many }) => ({
  incidents: many(incidents),
  serviceComponents: many(serviceComponents),
  incidentMetrics: many(incidentMetrics),
}));

export const incidentsRelations = relations(incidents, ({ one, many }) => ({
  dataSource: one(dataSources, {
    fields: [incidents.dataSourceId],
    references: [dataSources.id],
  }),
  updates: many(incidentUpdates),
}));

export const incidentUpdatesRelations = relations(incidentUpdates, ({ one }) => ({
  incident: one(incidents, {
    fields: [incidentUpdates.incidentId],
    references: [incidents.id],
  }),
}));

export const serviceComponentsRelations = relations(serviceComponents, ({ one }) => ({
  dataSource: one(dataSources, {
    fields: [serviceComponents.dataSourceId],
    references: [dataSources.id],
  }),
}));

export const incidentMetricsRelations = relations(incidentMetrics, ({ one }) => ({
  dataSource: one(dataSources, {
    fields: [incidentMetrics.dataSourceId],
    references: [dataSources.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemSchema = createInsertSchema(systems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSolutionSchema = createInsertSchema(solutions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInteractionSchema = createInsertSchema(interactions).omit({
  id: true,
  timestamp: true,
});

export const insertSLATargetSchema = createInsertSchema(slaTargets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertSearchQuerySchema = createInsertSchema(searchQueries).omit({
  id: true,
  timestamp: true,
});

export const insertDataSourceSchema = createInsertSchema(dataSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIncidentSchema = createInsertSchema(incidents).omit({
  id: true,
  syncedAt: true,
});

export const insertIncidentUpdateSchema = createInsertSchema(incidentUpdates).omit({
  id: true,
  timestamp: true,
});

export const insertServiceComponentSchema = createInsertSchema(serviceComponents).omit({
  id: true,
  syncedAt: true,
});

export const insertIncidentMetricSchema = createInsertSchema(incidentMetrics).omit({
  id: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type System = typeof systems.$inferSelect;
export type InsertSystem = z.infer<typeof insertSystemSchema>;
export type Solution = typeof solutions.$inferSelect;
export type InsertSolution = z.infer<typeof insertSolutionSchema>;
export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type SLATarget = typeof slaTargets.$inferSelect;
export type InsertSLATarget = z.infer<typeof insertSLATargetSchema>;
export type SLARecord = typeof slaRecords.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type SearchQuery = typeof searchQueries.$inferSelect;
export type InsertSearchQuery = z.infer<typeof insertSearchQuerySchema>;
export type SystemConfiguration = typeof systemConfigurations.$inferSelect;
export type DataSource = typeof dataSources.$inferSelect;
export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;
export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type IncidentUpdate = typeof incidentUpdates.$inferSelect;
export type InsertIncidentUpdate = z.infer<typeof insertIncidentUpdateSchema>;
export type ServiceComponent = typeof serviceComponents.$inferSelect;
export type InsertServiceComponent = z.infer<typeof insertServiceComponentSchema>;
export type IncidentMetric = typeof incidentMetrics.$inferSelect;
export type InsertIncidentMetric = z.infer<typeof insertIncidentMetricSchema>;

// Google Meet meetings table
export const googleMeetings = pgTable("google_meetings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  calendarEventId: varchar("calendar_event_id").notNull(),
  meetingId: varchar("meeting_id"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  meetLink: text("meet_link"),
  status: varchar("status", { length: 50 }).default('scheduled'), // scheduled, active, ended, cancelled
  attendees: jsonb("attendees").default('[]'),
  incidentId: integer("incident_id").references(() => incidents.id),
  systemId: integer("system_id").references(() => systems.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_google_meetings_user").on(table.userId),
  index("idx_google_meetings_calendar_event").on(table.calendarEventId),
  index("idx_google_meetings_start_time").on(table.startTime),
]);

// Google OAuth tokens for users
export const googleTokens = pgTable("google_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at").notNull(),
  scope: text("scope"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_google_tokens_user").on(table.userId),
]);

// Google Meet relations
export const googleMeetingsRelations = relations(googleMeetings, ({ one }) => ({
  user: one(users, {
    fields: [googleMeetings.userId],
    references: [users.id],
  }),
  incident: one(incidents, {
    fields: [googleMeetings.incidentId],
    references: [incidents.id],
  }),
  system: one(systems, {
    fields: [googleMeetings.systemId],
    references: [systems.id],
  }),
}));

export const googleTokensRelations = relations(googleTokens, ({ one }) => ({
  user: one(users, {
    fields: [googleTokens.userId],
    references: [users.id],
  }),
}));

// Google Meet insert schemas
export const insertGoogleMeetingSchema = createInsertSchema(googleMeetings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGoogleTokenSchema = createInsertSchema(googleTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Google Meet types
export type GoogleMeeting = typeof googleMeetings.$inferSelect;
export type InsertGoogleMeeting = z.infer<typeof insertGoogleMeetingSchema>;
export type GoogleToken = typeof googleTokens.$inferSelect;
export type InsertGoogleToken = z.infer<typeof insertGoogleTokenSchema>;
