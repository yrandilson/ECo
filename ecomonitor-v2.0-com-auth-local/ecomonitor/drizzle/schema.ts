import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).unique(),
  /** Local authentication - password hash (bcrypt) */
  passwordHash: varchar("passwordHash", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "moderator", "admin"]).default("user").notNull(),
  /** Password reset token and expiration */
  resetToken: varchar("resetToken", { length: 255 }),
  resetTokenExpires: timestamp("resetTokenExpires"),
  points: int("points").default(0).notNull(),
  trustScore: decimal("trustScore", { precision: 3, scale: 2 }).default("0.50").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  roleIdx: index("role_idx").on(table.role),
  emailIdx: index("email_idx").on(table.email),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Occurrence types
export const occurrenceTypes = mysqlEnum("occurrence_type", [
  "fire",
  "water_pollution",
  "air_pollution",
  "drought",
  "deforestation",
  "flooding",
  "other"
]);

// Severity levels
export const severityLevels = mysqlEnum("severity_level", [
  "low",
  "medium",
  "high",
  "critical"
]);

// Occurrences table
export const occurrences = mysqlTable("occurrences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  type: occurrenceTypes.notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  description: text("description"),
  severity: severityLevels.default("medium").notNull(),
  status: mysqlEnum("status", ["pending", "validated", "rejected", "archived"]).default("pending").notNull(),
  validatedBySatellite: boolean("validatedBySatellite").default(false),
  communityValidations: int("communityValidations").default(0),
  communityRejections: int("communityRejections").default(0),
  physicalParameters: json("physicalParameters"), // {temperature, humidity, windSpeed, vegetation, etc}
  riskScore: decimal("riskScore", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  typeIdx: index("type_idx").on(table.type),
  statusIdx: index("status_idx").on(table.status),
  geoIdx: index("geo_idx").on(table.latitude, table.longitude),
}));

export type Occurrence = typeof occurrences.$inferSelect;
export type InsertOccurrence = typeof occurrences.$inferInsert;

// Photos table
export const photos = mysqlTable("photos", {
  id: int("id").autoincrement().primaryKey(),
  occurrenceId: int("occurrenceId").notNull().references(() => occurrences.id),
  photoUrl: varchar("photoUrl", { length: 512 }).notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = typeof photos.$inferInsert;

// Validations table
export const validations = mysqlTable("validations", {
  id: int("id").autoincrement().primaryKey(),
  occurrenceId: int("occurrenceId").notNull().references(() => occurrences.id),
  userId: int("userId").notNull().references(() => users.id),
  isValid: boolean("isValid").notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  occurrenceIdx: index("validation_occurrence_idx").on(table.occurrenceId),
  userIdx: index("validation_user_idx").on(table.userId),
}));

export type Validation = typeof validations.$inferSelect;
export type InsertValidation = typeof validations.$inferInsert;

// Educational Simulations table
export const simulations = mysqlTable("simulations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  type: mysqlEnum("sim_type", ["fire", "water", "pollution", "deforestation", "water-quality"]).notNull(),
  parameters: json("parameters").notNull(), // Input parameters
  results: json("results").notNull(), // Calculated results
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("sim_user_idx").on(table.userId),
}));

export type Simulation = typeof simulations.$inferSelect;
export type InsertSimulation = typeof simulations.$inferInsert;

// Alerts table
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  occurrenceId: int("occurrenceId").references(() => occurrences.id),
  type: mysqlEnum("alert_type", ["geofence", "severity", "validation", "news"]).notNull(),
  severity: severityLevels.notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("alert_user_idx").on(table.userId),
}));

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

// Gamification - Badges table
export const badges = mysqlTable("badges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  badgeType: mysqlEnum("badge_type", [
    "fire_watcher",
    "water_guardian",
    "verifier",
    "student",
    "star",
    "environmental_hero"
  ]).notNull(),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("badge_user_idx").on(table.userId),
}));

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

// Gamification - Rankings table
export const rankings = mysqlTable("rankings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id),
  monthlyPoints: int("monthlyPoints").default(0),
  totalPoints: int("totalPoints").default(0),
  monthlyRank: int("monthlyRank").default(0),
  overallRank: int("overallRank").default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Ranking = typeof rankings.$inferSelect;
export type InsertRanking = typeof rankings.$inferInsert;

// Content Reports table - para denúncias de conteúdo inapropriado
export const contentReports = mysqlTable("content_reports", {
  id: int("id").autoincrement().primaryKey(),
  reporterId: int("reporterId").notNull().references(() => users.id),
  contentType: mysqlEnum("content_type", ["post", "comment", "user", "image", "other"]).notNull(),
  contentId: varchar("contentId", { length: 255 }).notNull(),
  reportType: mysqlEnum("report_type", [
    "spam",
    "harassment",
    "false_info",
    "inappropriate",
    "copyright",
    "other"
  ]).notNull(),
  reason: text("reason").notNull(),
  description: text("description"),
  status: mysqlEnum("report_status", ["pending", "reviewing", "resolved", "dismissed"]).default("pending").notNull(),
  severity: decimal("severity", { precision: 3, scale: 2 }).default("0.5").notNull(), // 0-1 score de severidade
  moderatorId: int("moderatorId"), // Quem analisou
  moderatorAction: varchar("moderatorAction", { length: 255 }), // Ação tomada
  moderatorNotes: text("moderatorNotes"), // Notas do moderador
  communityVotes: int("communityVotes").default(0), // Votos de concordância
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
}, (table) => ({
  reporterIdx: index("report_reporter_idx").on(table.reporterId),
  statusIdx: index("report_status_idx").on(table.status),
  contentIdx: index("report_content_idx").on(table.contentId),
  typeIdx: index("report_type_idx").on(table.reportType),
}));

export type ContentReport = typeof contentReports.$inferSelect;
export type InsertContentReport = typeof contentReports.$inferInsert;