import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { refundRequests, orders, payments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) return apiError("Unauthorized", 401);

    const body = await req.json();
    const {
      orderId,
      refundReasonType,
      bankRejectionLetterUrl,
      bankAccountNumber,
      bankAccountName,
      bankName,
      payoutDueDate,
    } = body;

    if (!orderId || !refundReasonType || !bankAccountNumber || !bankAccountName || !bankName || !payoutDueDate) {
      return apiError("Missing required fields", 400, "ERR_UI_060");
    }

    // Verify order exists and is eligible for refund
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) return apiError("Order not found", 404);

    if (!["BANK_REJECTED", "DEPOSIT_PAID"].includes(order.status)) {
      return apiError("Order is not eligible for refund", 400);
    }

    // Check for bank rejection letter when reason is BANK_LOAN_REJECTED
    if (refundReasonType === "BANK_LOAN_REJECTED" && !bankRejectionLetterUrl) {
      return apiError("Thiếu chứng từ từ chối vay", 400, "ERR_UI_070");
    }

    // Check if refund already exists for this order
    const [existingRefund] = await db
      .select()
      .from(refundRequests)
      .where(and(eq(refundRequests.orderId, orderId)))
      .limit(1);

    if (existingRefund && existingRefund.status !== "REJECTED") {
      return apiError("Đơn hoàn cọc đã được xử lý", 400, "ERR_UI_071");
    }

    // Get deposit amount from payments
    const [payment] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.orderId, orderId), eq(payments.paymentStatus, "SUCCESS")))
      .limit(1);

    const refundAmount = payment?.receivedAmount || order.depositAmount;

    const refundCode = `RF-${Date.now().toString(36).toUpperCase()}`;

    const [refund] = await db
      .insert(refundRequests)
      .values({
        refundCode,
        orderId,
        requestedBySale: token.sub,
        refundAmount: refundAmount,
        refundReasonType,
        bankRejectionLetterUrl: bankRejectionLetterUrl || null,
        bankAccountNumber,
        bankAccountName,
        bankName,
        payoutDueDate,
        status: "PENDING_MANAGER",
      })
      .returning();

    // Update order status
    await db
      .update(orders)
      .set({ status: "REFUND_REQUESTED", updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    return apiSuccess(refund, 201);
  } catch (error) {
    return apiError("Internal server error", 500);
  }
}
