import { pgTable, uuid, varchar, decimal, boolean, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";

export const discountApprovalStatusEnum = pgEnum("discount_approval_status", [
  "PENDING_MANAGER",
  "PENDING_ADMIN",
  "APPROVED",
  "REJECTED",
]);

export const discountPolicies = pgTable("discount_policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  role: varchar("role", { length: 20 }).notNull(),
  maxDiscountPercentage: decimal("max_discount_percentage", { precision: 5, scale: 2 }).notNull(),
  maxDiscountAmount: decimal("max_discount_amount", { precision: 15, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
});

export const discountRequests = pgTable("discount_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id"),
  requestedBySale: uuid("requested_by_sale").notNull().references(() => users.id),
  assignedApproverRole: varchar("assigned_approver_role", { length: 20 }).notNull(),
  approvedBy: uuid("approved_by").references(() => users.id),
  discountAmount: decimal("discount_amount", { precision: 15, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  managerNote: text("manager_note"),
  voucherCode: varchar("voucher_code", { length: 50 }).unique(),
  status: discountApprovalStatusEnum("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});
