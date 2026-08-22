import { pgTable, uuid, varchar, text, integer, timestamp, index, pgEnum } from "drizzle-orm/pg-core";
import { vehicleVariants } from "./vehicle-variants";
import { users } from "./users";

export const leadStatusEnum = pgEnum("lead_status", [
  "NEW",
  "CONTACTED",
  "TEST_DRIVE_BOOKED",
  "NEGOTIATING",
  "WON",
  "LOST",
]);

export const crmLeads = pgTable("crm_leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 15 }).notNull(),
  email: varchar("email", { length: 100 }),
  interestedVariantId: uuid("interested_variant_id").references(() => vehicleVariants.id),
  assignedSaleId: uuid("assigned_sale_id").references(() => users.id),
  leadStatus: leadStatusEnum("lead_status").notNull(),
  lostReason: text("lost_reason"),
  leadScore: integer("lead_score").default(10),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  idxLeadsPhone: index("idx_leads_phone").on(table.phone),
  idxLeadsSale: index("idx_leads_sale").on(table.assignedSaleId),
}));
