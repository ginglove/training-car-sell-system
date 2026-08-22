import { pgTable, uuid, varchar, decimal, text, integer, timestamp, index, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { vehicleVariants } from "./vehicle-variants";
import { showrooms } from "./showrooms";
import { vehicles } from "./vehicles";
import { tradeInRequests } from "./trade-in-requests";
import { discountRequests } from "./discount-requests";

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING_PAYMENT",
  "PAYMENT_FAILED",
  "DEPOSIT_PAID",
  "BANK_APPROVING",
  "BANK_APPROVED",
  "BANK_PARTIALLY_APPROVED",
  "BANK_REJECTED",
  "PROCESSING",
  "READY_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
  "REFUND_REQUESTED",
  "REFUNDED",
  "CANCELED",
]);

export const purchaseTypeEnum = pgEnum("purchase_type", ["DIRECT", "AUTO_LOAN"]);

export const registrationSubStatusEnum = pgEnum("registration_sub_status", [
  "REGISTRATION_PENDING",
  "PLATE_ASSIGNED",
  "PDI_COMPLETED",
]);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderCode: varchar("order_code", { length: 30 }).unique().notNull(),
  idempotencyKey: varchar("idempotency_key", { length: 100 }).unique().notNull(),
  customerId: uuid("customer_id").notNull().references(() => users.id),
  saleId: uuid("sale_id").references(() => users.id),
  variantId: uuid("variant_id").notNull().references(() => vehicleVariants.id),
  selectedColor: varchar("selected_color", { length: 50 }).notNull(),
  showroomId: uuid("showroom_id").notNull().references(() => showrooms.id),
  vinNumber: varchar("vin_number", { length: 17 }).references(() => vehicles.vinNumber),
  purchaseType: purchaseTypeEnum("purchase_type").notNull().default("DIRECT"),
  depositAmount: decimal("deposit_amount", { precision: 15, scale: 2 }).notNull(),
  totalListedPrice: decimal("total_listed_price", { precision: 15, scale: 2 }).notNull(),
  accessoriesTotalPrice: decimal("accessories_total_price", { precision: 15, scale: 2 }).notNull().default("0"),
  insuranceTotalPrice: decimal("insurance_total_price", { precision: 15, scale: 2 }).notNull().default("0"),
  tradeInOffsetId: uuid("trade_in_offset_id").references(() => tradeInRequests.id),
  tradeInCreditValue: decimal("trade_in_credit_value", { precision: 15, scale: 2 }).notNull().default("0"),
  finalPrice: decimal("final_price", { precision: 15, scale: 2 }).notNull(),
  appliedDiscountRequestId: uuid("applied_discount_request_id").references(() => discountRequests.id),
  cancellationReason: text("cancellation_reason"),
  cancelledBy: uuid("cancelled_by").references(() => users.id),
  registrationSubStatus: registrationSubStatusEnum("registration_sub_status"),
  status: orderStatusEnum("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  idxOrdersCustomerStatus: index("idx_orders_customer_status").on(table.customerId, table.status),
  idxOrdersPendingTimeout: index("idx_orders_pending_timeout").on(table.createdAt).where(sql`status = 'PENDING_PAYMENT'`),
}));

export const orderAccessories = pgTable("order_accessories", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  itemName: varchar("item_name", { length: 150 }).notNull(),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
});

export const actorTypeEnum = pgEnum("actor_type", [
  "USER",
  "SYSTEM",
  "PAYMENT_GATEWAY",
  "SCHEDULER",
]);

export const orderStatusHistory = pgTable("order_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  oldStatus: varchar("old_status", { length: 30 }),
  newStatus: varchar("new_status", { length: 30 }).notNull(),
  actorType: actorTypeEnum("actor_type").notNull(),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  correlationId: varchar("correlation_id", { length: 100 }),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
