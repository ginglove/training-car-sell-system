import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { orders, notifications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) return apiError("Unauthorized", 401);

    const role = token.role as string;
    if (!["SALE", "ADMIN", "MANAGER"].includes(role)) {
      return apiError("Forbidden", 403);
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, params.id))
      .limit(1);

    if (!order) return apiError("Order not found", 404);

    if (order.status !== "PENDING_PAYMENT") {
      return apiError("Order is not pending payment", 400);
    }

    // Generate mock PayLink URL
    const payLinkToken = Buffer.from(`${order.id}:${Date.now()}`).toString("base64url");
    const payLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/checkout/pay/${payLinkToken}`;

    // Create notification record (simulating Zalo ZNS)
    await db.insert(notifications).values({
      userId: order.customerId,
      eventType: "PAYLINK_SENT",
      channel: "ZALO_ZNS",
      title: `Thanh toán đặt cọc - ${order.orderCode}`,
      content: `Xin chào! Vui lòng thanh toán đặt cọc ${order.depositAmount} VNĐ cho đơn hàng ${order.orderCode}. Link: ${payLink}`,
      deliveryStatus: "SENT",
    });

    return apiSuccess({
      payLink,
      orderCode: order.orderCode,
      depositAmount: order.depositAmount,
      message: "PayLink đã được gửi qua Zalo ZNS",
    });
  } catch (error) {
    return apiError("Internal server error", 500);
  }
}
