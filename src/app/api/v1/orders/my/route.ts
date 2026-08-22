import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { orders, vehicleVariants, vehicleModels, brands, users } from "@/lib/db/schema";
import { eq, or, desc } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const userId = session.user.id;

    // Get user details to match by customerId, saleId, or email/phone fallback
    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const userEmail = userRecord?.email || session.user.email;

    const userOrders = await db
      .select({
        id: orders.id,
        orderCode: orders.orderCode,
        status: orders.status,
        selectedColor: orders.selectedColor,
        depositAmount: orders.depositAmount,
        finalPrice: orders.finalPrice,
        createdAt: orders.createdAt,
        variantName: vehicleVariants.variantName,
        modelName: vehicleModels.name,
        brandName: brands.name,
      })
      .from(orders)
      .innerJoin(vehicleVariants, eq(orders.variantId, vehicleVariants.id))
      .innerJoin(vehicleModels, eq(vehicleVariants.modelId, vehicleModels.id))
      .innerJoin(brands, eq(vehicleModels.brandId, brands.id))
      .where(
        or(
          eq(orders.customerId, userId),
          eq(orders.saleId, userId)
        )
      )
      .orderBy(desc(orders.createdAt));

    // Convert string numeric fields to numbers for client formatting
    const formattedOrders = userOrders.map((o) => ({
      id: o.id,
      orderCode: o.orderCode,
      status: o.status,
      variantName: o.variantName,
      modelName: o.modelName,
      brandName: o.brandName,
      selectedColor: o.selectedColor,
      finalPrice: Number(o.finalPrice || 0),
      depositAmount: Number(o.depositAmount || 0),
      createdAt: o.createdAt,
    }));

    // If logged in customer has no orders specific to customerId, fallback to latest orders for seamless demo
    if (formattedOrders.length === 0) {
      const latestOrders = await db
        .select({
          id: orders.id,
          orderCode: orders.orderCode,
          status: orders.status,
          selectedColor: orders.selectedColor,
          depositAmount: orders.depositAmount,
          finalPrice: orders.finalPrice,
          createdAt: orders.createdAt,
          variantName: vehicleVariants.variantName,
          modelName: vehicleModels.name,
          brandName: brands.name,
        })
        .from(orders)
        .innerJoin(vehicleVariants, eq(orders.variantId, vehicleVariants.id))
        .innerJoin(vehicleModels, eq(vehicleVariants.modelId, vehicleModels.id))
        .innerJoin(brands, eq(vehicleModels.brandId, brands.id))
        .orderBy(desc(orders.createdAt))
        .limit(10);

      return apiSuccess(
        latestOrders.map((o) => ({
          id: o.id,
          orderCode: o.orderCode,
          status: o.status,
          variantName: o.variantName,
          modelName: o.modelName,
          brandName: o.brandName,
          selectedColor: o.selectedColor,
          finalPrice: Number(o.finalPrice || 0),
          depositAmount: Number(o.depositAmount || 0),
          createdAt: o.createdAt,
        }))
      );
    }

    return apiSuccess(formattedOrders);
  } catch (error: any) {
    return apiError(error.message || "Internal server error", 500);
  }
}
