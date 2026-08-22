import { pgTable, uuid, varchar, decimal, integer, timestamp, jsonb, boolean, text, index, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { orders } from "./orders";

export const gatewayEnum = pgEnum("payment_gateway", [
  "MOCK_GATEWAY",
  "MOCK_VIETQR",
  "MOCK_VNPAY",
  "POS_SHOWROOM",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "PARTIAL_PAID",
  "SUCCESS",
  "FAILED",
  "EXPIRED",
]);

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  attemptNo: integer("attempt_no").notNull().default(1),
  transactionRef: varchar("transaction_ref", { length: 100 }).unique().notNull(),
  gateway: gatewayEnum("gateway").notNull().default("MOCK_GATEWAY"),
  snapshotAmount: decimal("snapshot_amount", { precision: 15, scale: 2 }).notNull(),
  receivedAmount: decimal("received_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 10 }).default("VND"),
  paymentStatus: paymentStatusEnum("payment_status").notNull(),
  gatewayTransactionNo: varchar("gateway_transaction_no", { length: 100 }),
  gatewayResponseCode: varchar("gateway_response_code", { length: 20 }),
  gatewayBankCode: varchar("gateway_bank_code", { length: 50 }),
  gatewayPayDate: timestamp("gateway_pay_date", { withTimezone: true }),
  clientIp: varchar("client_ip", { length: 45 }),
  errorCode: varchar("error_code", { length: 50 }),
  needsManualRefund: boolean("needs_manual_refund").default(false),
  rawResponse: jsonb("raw_response"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  idxPaymentsTransactionRef: index("idx_payments_transaction_ref").on(table.transactionRef, table.gateway).where(sql`payment_status = 'PENDING'`),
}));

export const outboxStatusEnum = pgEnum("outbox_status", ["PENDING", "PROCESSED", "FAILED"]);

export const outboxEvents = pgTable("outbox_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  aggregateType: varchar("aggregate_type", { length: 50 }).notNull(),
  aggregateId: uuid("aggregate_id").notNull(),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  payload: jsonb("payload").notNull(),
  status: outboxStatusEnum("status").notNull().default("PENDING"),
  retryCount: integer("retry_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
}, (table) => ({
  idxOutboxPending: index("idx_outbox_pending").on(table.status, table.createdAt).where(sql`status = 'PENDING'`),
}));
