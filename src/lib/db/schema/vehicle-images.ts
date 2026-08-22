import { pgTable, uuid, text, boolean, integer } from "drizzle-orm/pg-core";
import { vehicleVariants } from "./vehicle-variants";

export const vehicleImages = pgTable("vehicle_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  variantId: uuid("variant_id").notNull().references(() => vehicleVariants.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  isThumbnail: boolean("is_thumbnail").default(false),
  is360Asset: boolean("is_360_asset").default(false),
  angleOrder: integer("angle_order").default(0),
});
