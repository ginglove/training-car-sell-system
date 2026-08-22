import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { refundRequests, orders, auditLogs } from "@/lib/db/schema";
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
    if (!["MANAGER", "ADMIN"].includes(role)) {
      return apiError("Forbidden", 403);
    }

    const body = await req.json();
    const { decision, managerOverrideReason } = body;

    if (!decision || !["APPROVED", "REJECTED"].includes(decision)) {
      return apiError("Invalid decision", 400);
    }

    const [refund] = await db
      .select()
      .from(refundRequests)
      .where(eq(refundRequests.id, params.id))
      .limit(1);

    if (!refund) return apiError("Refund request not found", 404);

    const oldStatus = refund.status;

    // Manager can approve PENDING_MANAGER -> PENDING_ADMIN or REJECTED
    // Admin can approve PENDING_ADMIN -> COMPLETED or REJECTED
    if (role === "MANAGER") {
      if (refund.status !== "PENDING_MANAGER") {
        return apiError("Refund is not pending manager approval", 400);
      }

      if (decision === "APPROVED") {
        await db
          .update(refundRequests)
          .set({
            status: "PENDING_ADMIN",
            confirmedByManager: token.sub,
            managerOverrideReason: managerOverrideReason || null,
          })
          .where(eq(refundRequests.id, params.id));
      } else {
        await db
          .update(refundRequests)
          .set({
            status: "REJECTED",
            confirmedByManager: token.sub,
            managerOverrideReason: managerOverrideReason || null,
          })
          .where(eq(refundRequests.id, params.id));
      }
    } else if (role === "ADMIN") {
      if (refund.status !== "PENDING_ADMIN") {
        return apiError("Refund is not pending admin approval", 400);
      }

      if (decision === "APPROVED") {
        await db
          .update(refundRequests)
          .set({
            status: "COMPLETED",
            approvedByAdmin: token.sub,
            completedAt: new Date(),
          })
          .where(eq(refundRequests.id, params.id));

        // Update order status to REFUNDED
        await db
          .update(orders)
          .set({ status: "REFUNDED", updatedAt: new Date() })
          .where(eq(orders.id, refund.orderId));
      } else {
        await db
          .update(refundRequests)
          .set({
            status: "REJECTED",
            approvedByAdmin: token.sub,
          })
          .where(eq(refundRequests.id, params.id));
      }
    }

    // Audit log
    await db.insert(auditLogs).values({
      actorType: "USER",
      actorUserId: token.sub,
      action: `REFUND_${decision}`,
      entityType: "REFUND_REQUEST",
      entityId: params.id,
      oldValue: { status: oldStatus },
      newValue: { status: decision === "APPROVED" ? (role === "MANAGER" ? "PENDING_ADMIN" : "COMPLETED") : "REJECTED" },
      correlationId: refund.refundCode,
    });

    return apiSuccess({ message: `Refund ${decision.toLowerCase()} successfully` });
  } catch (error) {
    return apiError("Internal server error", 500);
  }
}
