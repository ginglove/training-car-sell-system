import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { vehicleModels, brands, vehicleVariants, vehicleQuotas, vehicleImages } from "@/lib/db/schema";
import { eq, ilike, sql, and, gte, lte } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bodyType = searchParams.get("bodyType");
    const priceRange = searchParams.get("priceRange");
    const search = searchParams.get("search");

    const conditions: any[] = [];

    if (bodyType && bodyType !== "all") {
      conditions.push(eq(vehicleModels.bodyType, bodyType));
    }

    if (priceRange && priceRange !== "all") {
      const ranges: Record<string, [number, number]> = {
        under500: [0, 500000000],
        "500to1000": [500000000, 1000000000],
        "1000to1500": [1000000000, 1500000000],
        above1500: [1500000000, 99999999999],
      };
      const range = ranges[priceRange];
      if (range) {
        conditions.push(gte(vehicleVariants.listedPrice, String(range[0])));
        conditions.push(lte(vehicleVariants.listedPrice, String(range[1])));
      }
    }

    if (search) {
      conditions.push(
        sql`(${ilike(vehicleModels.name, `%${search}%`)} OR ${ilike(brands.name, `%${search}%`)} OR ${ilike(vehicleVariants.variantName, `%${search}%`)})`
      );
    }

    const results = await db
      .select({
        id: vehicleVariants.id,
        variantName: vehicleVariants.variantName,
        listedPrice: vehicleVariants.listedPrice,
        modelName: vehicleModels.name,
        brandName: brands.name,
        bodyType: vehicleModels.bodyType,
        thumbnailUrl: sql<string | null>`MAX(${vehicleImages.imageUrl})`,
        availableQuota: sql<number>`COALESCE(SUM(${vehicleQuotas.availableQuota}), 0)`,
      })
      .from(vehicleVariants)
      .innerJoin(vehicleModels, eq(vehicleVariants.modelId, vehicleModels.id))
      .innerJoin(brands, eq(vehicleModels.brandId, brands.id))
      .leftJoin(vehicleQuotas, eq(vehicleQuotas.variantId, vehicleVariants.id))
      .leftJoin(vehicleImages, and(eq(vehicleImages.variantId, vehicleVariants.id), eq(vehicleImages.isThumbnail, true)))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(
        vehicleVariants.id,
        vehicleVariants.variantName,
        vehicleVariants.listedPrice,
        vehicleModels.name,
        brands.name,
        vehicleModels.bodyType
      )
      .orderBy(vehicleVariants.listedPrice);

    return apiSuccess(results);
  } catch (error: any) {
    return apiError(error.message || "Internal server error", 500);
  }
}
