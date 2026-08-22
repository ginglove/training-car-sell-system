import { pgTable, uuid, varchar, integer, decimal, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";

export const tradeInStatusEnum = pgEnum("trade_in_status", [
  "SUBMITTED",
  "APPRAISING",
  "OFFERED",
  "ACCEPTED",
  "CONTRACT_SIGNED",
  "CREDITED_TO_ORDER",
  "INSPECTION_FAILED",
  "REJECTED",
]);

export const tradeInRequests = pgTable("trade_in_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id"),
  customerId: uuid("customer_id").notNull().references(() => users.id),
  assignedAppraiserId: uuid("assigned_appraiser_id").references(() => users.id),
  oldCarBrand: varchar("old_car_brand", { length: 100 }).notNull(),
  oldCarModel: varchar("old_car_model", { length: 100 }).notNull(),
  manufacturingYear: integer("manufacturing_year").notNull(),
  odoKm: integer("odo_km").notNull(),
  expectedPrice: decimal("expected_price", { precision: 15, scale: 2 }).notNull(),
  appraisedPrice: decimal("appraised_price", { precision: 15, scale: 2 }),
  finalTradeInValue: decimal("final_trade_in_value", { precision: 15, scale: 2 }),
  status: tradeInStatusEnum("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
