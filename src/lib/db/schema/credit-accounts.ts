import { pgTable, uuid, varchar, decimal, timestamp, text, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";

export const customerCreditAccounts = pgTable("customer_credit_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").unique().notNull().references(() => users.id, { onDelete: "cascade" }),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 10 }).default("VND"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const creditTransactionTypeEnum = pgEnum("credit_transaction_type", [
  "CREDIT_DEPOSIT_OVERPAY",
  "CREDIT_PARTIAL_EXPIRED",
  "CREDIT_REFUND",
  "DEBIT_APPLIED_TO_ORDER",
]);

export const creditTransactions = pgTable("credit_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").notNull().references(() => customerCreditAccounts.id, { onDelete: "cascade" }),
  idempotencyKey: varchar("idempotency_key", { length: 100 }).unique().notNull(),
  orderId: uuid("order_id"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  type: creditTransactionTypeEnum("type").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
