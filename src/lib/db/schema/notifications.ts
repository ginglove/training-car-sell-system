import { pgTable, uuid, varchar, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";

export const notificationChannelEnum = pgEnum("notification_channel", [
  "IN_APP",
  "SMS_BRANDNAME",
  "ZALO_ZNS",
  "EMAIL",
]);

export const deliveryStatusEnum = pgEnum("delivery_status", [
  "PENDING",
  "SENT",
  "FAILED",
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  channel: notificationChannelEnum("channel").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  deliveryStatus: deliveryStatusEnum("delivery_status").default("PENDING"),
  retryCount: integer("retry_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
