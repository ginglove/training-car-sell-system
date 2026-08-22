import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { payments, orders, vehicleQuotas, customerCreditAccounts, creditTransactions, orderStatusHistory } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    // Simulate network latency for mock payment gateway Sandbox
    await new Promise((resolve) => setTimeout(resolve, 500));

    const body = await request.json();
    const { transactionRef, orderId, result, receivedAmount: overrideAmount } = body;

    if ((!transactionRef && !orderId) || !result) {
      return apiError("transactionRef or orderId, and result are required", 400);
    }

    let payment;
    if (orderId) {
      const [p] = await db
        .select()
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .orderBy(sql`${payments.createdAt} DESC`)
        .limit(1);
      payment = p;
    } else if (transactionRef) {
      const [p] = await db
        .select()
        .from(payments)
        .where(eq(payments.transactionRef, transactionRef))
        .limit(1);
      payment = p;
    }

    if (!payment) {
      return apiError("Payment not found", 404);
    }

    const snapshotAmount = Number(payment.snapshotAmount);
    let receivedAmount = 0;
    let paymentStatus = "";
    let orderStatus = "";

    switch (result) {
      case "SUCCESS":
        receivedAmount = snapshotAmount;
        paymentStatus = "SUCCESS";
        orderStatus = "DEPOSIT_PAID";
        break;
      case "PARTIAL_PAID":
        receivedAmount = overrideAmount || Math.floor(snapshotAmount * 0.5);
        paymentStatus = "PARTIAL_PAID";
        orderStatus = "PENDING_PAYMENT";
        break;
      case "FAILED":
        receivedAmount = 0;
        paymentStatus = "FAILED";
        orderStatus = "PAYMENT_FAILED";
        break;
      case "EXPIRED":
        receivedAmount = 0;
        paymentStatus = "EXPIRED";
        orderStatus = "CANCELED";
        break;
      default:
        return apiError("Invalid result type", 400);
    }

    await db
      .update(payments)
      .set({
        receivedAmount: String(receivedAmount),
        paymentStatus: paymentStatus as any,
        gatewayTransactionNo: `GW-${Date.now()}`,
        gatewayResponseCode: result === "SUCCESS" ? "00" : "99",
        gatewayBankCode: "MOCK_BANK",
        gatewayPayDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, payment.orderId))
      .limit(1);

    if (order) {
      await db
        .update(orders)
        .set({ status: orderStatus as any, updatedAt: new Date() })
        .where(eq(orders.id, payment.orderId));

      await db.insert(orderStatusHistory).values({
        orderId: payment.orderId,
        oldStatus: order.status,
        newStatus: orderStatus as any,
        actorType: "PAYMENT_GATEWAY",
        correlationId: transactionRef,
        reason: `Mock payment ${result}`,
      });

      if (result === "EXPIRED" || result === "FAILED") {
        await db.execute(sql`
          UPDATE vehicle_quotas
          SET soft_locked_count = GREATEST(soft_locked_count - 1, 0)
          WHERE variant_id = ${order.variantId}
            AND color = ${order.selectedColor}
            AND showroom_id = ${order.showroomId}
        `);
      }

      if (result === "PARTIAL_PAID" && receivedAmount > 0) {
        const [account] = await db
          .select()
          .from(customerCreditAccounts)
          .where(eq(customerCreditAccounts.customerId, order.customerId))
          .limit(1);

        if (!account) {
          await db.insert(customerCreditAccounts).values({
            customerId: order.customerId,
            balance: String(receivedAmount),
          });
        } else {
          await db
            .update(customerCreditAccounts)
            .set({
              balance: String(Number(account.balance) + receivedAmount),
              updatedAt: new Date(),
            })
            .where(eq(customerCreditAccounts.id, account.id));
        }

        await db.insert(creditTransactions).values({
          accountId: account?.id || (await db.select({ id: customerCreditAccounts.id }).from(customerCreditAccounts).where(eq(customerCreditAccounts.customerId, order.customerId)).limit(1))[0].id,
          idempotencyKey: `partial-${transactionRef}-${uuidv4().slice(0, 8)}`,
          orderId: payment.orderId,
          amount: String(receivedAmount),
          type: "CREDIT_PARTIAL_EXPIRED",
          description: `Partial payment refund for order ${order.orderCode}`,
        });
      }
    }

    return apiSuccess({ paymentStatus, orderStatus, receivedAmount });
  } catch (error: any) {
    return apiError(error.message || "Internal server error", 500);
  }
}
