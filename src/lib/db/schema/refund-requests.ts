import { pgTable, uuid, varchar, decimal, text, date, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { orders } from "./orders";
import { users } from "./users";

export const refundReasonEnum = pgEnum("refund_reason_type", [
  "BANK_LOAN_REJECTED",
  "SYSTEM_TIMEOUT_ERROR",
  "FORCE_MAJEURE",
]);

export const refundStatusEnum = pgEnum("refund_status", [
  "DRAFT",
  "PENDING_MANAGER",
  "PENDING_ADMIN",
  "COMPLETED",
  "REJECTED",
]);

export const refundRequests = pgTable("refund_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  refundCode: varchar("refund_code", { length: 30 }).unique().notNull(),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  requestedBySale: uuid("requested_by_sale").notNull().references(() => users.id),
  confirmedByManager: uuid("confirmed_by_manager").references(() => users.id),
  approvedByAdmin: uuid("approved_by_admin").references(() => users.id),
  refundAmount: decimal("refund_amount", { precision: 15, scale: 2 }).notNull(),
  refundReasonType: refundReasonEnum("refund_reason_type").notNull(),
  bankRejectionLetterUrl: text("bank_rejection_letter_url"),
  managerOverrideReason: text("manager_override_reason"),
  bankAccountNumber: varchar("bank_account_number", { length: 50 }).notNull(),
  bankAccountName: varchar("bank_account_name", { length: 100 }).notNull(),
  bankName: varchar("bank_name", { length: 100 }).notNull(),
  payoutDueDate: date("payout_due_date").notNull(),
  status: refundStatusEnum("status").notNull(),
  bankTransferSlipUrl: text("bank_transfer_slip_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
