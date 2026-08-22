import { pgTable, uuid, varchar, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { actorTypeEnum } from "./orders";

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorType: actorTypeEnum("actor_type").notNull(),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: varchar("entity_id", { length: 100 }).notNull(),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  queryFilter: text("query_filter"),
  decryptedUserIds: uuid("decrypted_user_ids").array(),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  correlationId: varchar("correlation_id", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
