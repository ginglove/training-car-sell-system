import { pgTable, uuid, varchar, boolean, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { showrooms } from "./showrooms";

export const roleEnum = pgEnum("user_role", ["ADMIN", "MANAGER", "SALE", "CUSTOMER"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 100 }).unique().notNull(),
  phone: varchar("phone", { length: 15 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  role: roleEnum("role").notNull(),
  showroomId: uuid("showroom_id").references(() => showrooms.id, { onDelete: "set null" }),
  isActive: boolean("is_active").default(true),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
