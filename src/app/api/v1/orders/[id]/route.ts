import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { orders, payments, loanApplications, orderAccessories, vehicleVariants, vehicleModels, brands } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const orderId = params.id;

    const [order] = await db
      .select({
        id: orders.id,
        orderCode: orders.orderCode,
        customerId: orders.customerId,
        saleId: orders.saleId,
        variantId: orders.variantId,
        selectedColor: orders.selectedColor,
        showroomId: orders.showroomId,
        vinNumber: orders.vinNumber,
        purchaseType: orders.purchaseType,
        depositAmount: orders.depositAmount,
        totalListedPrice: orders.totalListedPrice,
        accessoriesTotalPrice: orders.accessoriesTotalPrice,
        insuranceTotalPrice: orders.insuranceTotalPrice,
        tradeInCreditValue: orders.tradeInCreditValue,
        finalPrice: orders.finalPrice,
        status: orders.status,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        variantName: vehicleVariants.variantName,
        modelName: vehicleModels.name,
        brandName: brands.name,
      })
      .from(orders)
      .innerJoin(vehicleVariants, eq(orders.variantId, vehicleVariants.id))
      .innerJoin(vehicleModels, eq(vehicleVariants.modelId, vehicleModels.id))
      .innerJoin(brands, eq(vehicleModels.brandId, brands.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return apiError("Order not found", 404);
    }

    if (
      session.user.role === "CUSTOMER" &&
      order.customerId !== session.user.id
    ) {
      return apiError("Forbidden", 403);
    }

    const orderPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .orderBy(payments.createdAt);

    const accessories = await db
      .select()
      .from(orderAccessories)
      .where(eq(orderAccessories.orderId, orderId));

    const loans = await db
      .select()
      .from(loanApplications)
      .where(eq(loanApplications.orderId, orderId))
      .orderBy(loanApplications.createdAt);

    return apiSuccess({
      ...order,
      payments: orderPayments,
      accessories,
      loans,
    });
  } catch (error: any) {
    return apiError(error.message || "Internal server error", 500);
  }
}
