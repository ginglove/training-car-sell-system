import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return new Response("orderId is required", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let attempts = 0;
      const maxAttempts = 450;

      const poll = async () => {
        try {
          const [payment] = await db
            .select({
              status: payments.paymentStatus,
              receivedAmount: payments.receivedAmount,
              gatewayTransactionNo: payments.gatewayTransactionNo,
            })
            .from(payments)
            .where(eq(payments.orderId, orderId))
            .orderBy(payments.createdAt)
            .limit(1);

          if (payment) {
            const data = JSON.stringify(payment);
            controller.enqueue(
              encoder.encode(`data: ${data}\n\n`)
            );

            if (
              payment.status === "SUCCESS" ||
              payment.status === "FAILED" ||
              payment.status === "EXPIRED"
            ) {
              controller.close();
              return;
            }
          }

          attempts++;
          if (attempts >= maxAttempts) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ status: "TIMEOUT" })}\n\n`)
            );
            controller.close();
            return;
          }

          setTimeout(poll, 2000);
        } catch {
          controller.close();
        }
      };

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "CONNECTED" })}\n\n`));
      setTimeout(poll, 2000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
