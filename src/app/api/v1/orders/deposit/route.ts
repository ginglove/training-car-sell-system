import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { orders, vehicleVariants, vehicleQuotas, orderAccessories, payments, showrooms } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { v4 as uuidv4 } from "uuid";
import { generateOrderCode } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json();
    const {
      variantId,
      selectedColor,
      showroomId: bodyShowroomId,
      accessories = [],
      includeInsurance = false,
      tradeInOffsetId = null,
      tradeInCreditValue = 0,
      paymentMethod = "MOCK_GATEWAY",
      purchaseType = "DIRECT",
      idempotencyKey,
    } = body;

    if (!variantId || !selectedColor) {
      return apiError("Missing required fields (variantId, selectedColor)", 400);
    }

    let showroomId = bodyShowroomId;
    if (!showroomId) {
      const [quota] = await db
        .select({ showroomId: vehicleQuotas.showroomId })
        .from(vehicleQuotas)
        .where(
          and(
            eq(vehicleQuotas.variantId, variantId),
            eq(vehicleQuotas.color, selectedColor)
          )
        )
        .limit(1);

      if (quota) {
        showroomId = quota.showroomId;
      } else {
        const [firstShowroom] = await db
          .select({ id: vehicleQuotas.showroomId })
          .from(vehicleQuotas)
          .limit(1);
        showroomId = firstShowroom?.id;
      }
    }

    if (!showroomId) {
      const [sr] = await db.select({ id: showrooms.id }).from(showrooms).limit(1);
      showroomId = sr?.id;
    }

    const idemKey = idempotencyKey || uuidv4();

    const [variant] = await db
      .select()
      .from(vehicleVariants)
      .where(eq(vehicleVariants.id, variantId))
      .limit(1);

    if (!variant) {
      return apiError("Vehicle variant not found", 404);
    }

    const lockResult = await db.execute(sql`
      UPDATE vehicle_quotas
      SET soft_locked_count = soft_locked_count + 1
      WHERE variant_id = ${variantId}
        AND color = ${selectedColor}
        AND showroom_id = ${showroomId}
      RETURNING id
    `);

    if (!lockResult.rows || lockResult.rows.length === 0) {
      return apiError("Vehicle is out of stock", 409, "ERR_UI_040");
    }

    const accessoriesTotal = accessories.reduce(
      (sum: number, a: any) => sum + (a.price || 0) * (a.quantity || 1),
      0
    );
    const insuranceTotal = includeInsurance ? 15000000 : 0;
    const finalPrice =
      Number(variant.listedPrice) +
      accessoriesTotal +
      insuranceTotal -
      tradeInCreditValue;

    const orderCode = generateOrderCode();
    const txnRef = `TXN-${Date.now()}-${uuidv4().slice(0, 8)}`;

    const [newOrder] = await db
      .insert(orders)
      .values({
        orderCode,
        idempotencyKey: idemKey,
        customerId: session.user.role === "CUSTOMER" ? session.user.id : body.customerId || session.user.id,
        saleId: session.user.role === "SALE" ? session.user.id : null,
        variantId,
        selectedColor,
        showroomId,
        purchaseType,
        depositAmount: String(variant.minDepositAmount),
        totalListedPrice: String(variant.listedPrice),
        accessoriesTotalPrice: String(accessoriesTotal),
        insuranceTotalPrice: String(insuranceTotal),
        tradeInOffsetId: tradeInOffsetId,
        tradeInCreditValue: String(tradeInCreditValue),
        finalPrice: String(finalPrice),
        status: "PENDING_PAYMENT",
      })
      .returning();

    if (accessories.length > 0) {
      await db.insert(orderAccessories).values(
        accessories.map((a: any) => ({
          orderId: newOrder.id,
          itemName: a.name,
          price: String(a.price),
          quantity: a.quantity || 1,
        }))
      );
    }

    await db.insert(payments).values({
      orderId: newOrder.id,
      attemptNo: 1,
      transactionRef: txnRef,
      gateway: paymentMethod,
      snapshotAmount: String(variant.minDepositAmount),
      receivedAmount: "0",
      paymentStatus: "PENDING",
    });

    return apiSuccess(
      {
        orderId: newOrder.id,
        orderCode,
        transactionRef: txnRef,
        depositAmount: Number(variant.minDepositAmount),
        finalPrice,
      },
      201
    );
  } catch (error: any) {
    if (error.code === "23505" && error.constraint?.includes("idempotency")) {
      return apiError("Duplicate order request", 409);
    }
    return apiError(error.message || "Internal server error", 500);
  }
}
