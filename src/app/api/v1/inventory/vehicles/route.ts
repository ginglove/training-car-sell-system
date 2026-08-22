import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { vehicles, vehicleVariants, vehicleModels, brands, showrooms } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "MANAGER", "SALE"].includes(session.user.role)) {
      return apiError("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const showroomId = searchParams.get("showroom_id");
    const status = searchParams.get("status");

    const conditions: any[] = [];

    if (showroomId) {
      conditions.push(eq(vehicles.showroomId, showroomId));
    } else if (session.user.role === "MANAGER" && session.user.showroomId) {
      conditions.push(eq(vehicles.showroomId, session.user.showroomId));
    }

    if (status) {
      conditions.push(eq(vehicles.status, status));
    }

    if (session.user.role === "SALE") {
      conditions.push(eq(vehicles.status, "AVAILABLE"));
    }

    const results = await db
      .select({
        vinNumber: vehicles.vinNumber,
        engineNumber: vehicles.engineNumber,
        color: vehicles.color,
        manufacturingYear: vehicles.manufacturingYear,
        originType: vehicles.originType,
        status: vehicles.status,
        lockedUntil: vehicles.lockedUntil,
        showroomName: showrooms.name,
        variantName: vehicleVariants.variantName,
        modelName: vehicleModels.name,
        brandName: brands.name,
      })
      .from(vehicles)
      .innerJoin(vehicleVariants, eq(vehicles.variantId, vehicleVariants.id))
      .innerJoin(vehicleModels, eq(vehicleVariants.modelId, vehicleModels.id))
      .innerJoin(brands, eq(vehicleModels.brandId, brands.id))
      .innerJoin(showrooms, eq(vehicles.showroomId, showrooms.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(vehicles.createdAt);

    return apiSuccess(results);
  } catch (error: any) {
    return apiError(error.message || "Internal server error", 500);
  }
}
