import { pgTable, uuid, varchar, decimal, integer, boolean, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { orders } from "./orders";

export const loanStatusEnum = pgEnum("loan_status", [
  "SUBMITTED",
  "IN_REVIEW",
  "APPROVED",
  "PARTIALLY_APPROVED",
  "REJECTED",
]);

export const loanApplications = pgTable("loan_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  bankName: varchar("bank_name", { length: 100 }).notNull(),
  switchCount: integer("switch_count").notNull().default(0),
  requestedLoanAmount: decimal("requested_loan_amount", { precision: 15, scale: 2 }).notNull(),
  approvedLoanAmount: decimal("approved_loan_amount", { precision: 15, scale: 2 }),
  additionalCashNeeded: decimal("additional_cash_needed", { precision: 15, scale: 2 }).default("0"),
  loanTermMonths: integer("loan_term_months").notNull(),
  interestRatePercent: decimal("interest_rate_percent", { precision: 5, scale: 2 }).notNull(),
  hasCoBorrower: boolean("has_co_borrower").default(false),
  coBorrowerName: varchar("co_borrower_name", { length: 100 }),
  coBorrowerPhone: varchar("co_borrower_phone", { length: 15 }),
  financialDocumentsUrls: text("financial_documents_urls").array(),
  status: loanStatusEnum("status").notNull(),
  approvalLetterUrl: text("approval_letter_url"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
