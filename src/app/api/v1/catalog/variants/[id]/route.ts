import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { vehicleVariants, vehicleModels, brands, vehicleImages, vehicleQuotas, showrooms } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const variantId = params.id;

    const [variant] = await db
      .select({
        id: vehicleVariants.id,
        variantName: vehicleVariants.variantName,
        listedPrice: vehicleVariants.listedPrice,
        minDepositAmount: vehicleVariants.minDepositAmount,
        specsJson: vehicleVariants.specsJson,
        modelName: vehicleModels.name,
        brandName: brands.name,
        bodyType: vehicleModels.bodyType,
      })
      .from(vehicleVariants)
      .innerJoin(vehicleModels, eq(vehicleVariants.modelId, vehicleModels.id))
      .innerJoin(brands, eq(vehicleModels.brandId, brands.id))
      .where(eq(vehicleVariants.id, variantId))
      .limit(1);

    if (!variant) {
      return apiError("Vehicle variant not found", 404);
    }

    const images = await db
      .select({
        url: vehicleImages.imageUrl,
        is360: vehicleImages.is360Asset,
        angle: vehicleImages.angleOrder,
        isThumbnail: vehicleImages.isThumbnail,
      })
      .from(vehicleImages)
      .where(eq(vehicleImages.variantId, variantId))
      .orderBy(vehicleImages.angleOrder);

    const colors = await db
      .select({
        color: vehicleQuotas.color,
        quota: vehicleQuotas.availableQuota,
        showroomId: vehicleQuotas.showroomId,
        showroomName: showrooms.name,
      })
      .from(vehicleQuotas)
      .innerJoin(showrooms, eq(vehicleQuotas.showroomId, showrooms.id))
      .where(eq(vehicleQuotas.variantId, variantId));

    return apiSuccess({
      ...variant,
      images,
      colors,
    });
  } catch (error: any) {
    return apiError(error.message || "Internal server error", 500);
  }
}
