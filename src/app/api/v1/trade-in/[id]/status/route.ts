import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { tradeInRequests, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

const VALID_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["APPRAISING", "REJECTED"],
  APPRAISING: ["OFFERED", "INSPECTION_FAILED"],
  OFFERED: ["ACCEPTED", "REJECTED"],
  ACCEPTED: ["CONTRACT_SIGNED"],
  CONTRACT_SIGNED: ["CREDITED_TO_ORDER"],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) return apiError("Unauthorized", 401);

    const role = token.role as string;
    if (!["SALE", "MANAGER", "ADMIN"].includes(role)) {
      return apiError("Forbidden", 403);
    }

    const body = await req.json();
    const { status, appraisedPrice, finalTradeInValue } = body;

    if (!status) return apiError("Status is required", 400);

    const [tradeIn] = await db
      .select()
      .from(tradeInRequests)
      .where(eq(tradeInRequests.id, params.id))
      .limit(1);

    if (!tradeIn) return apiError("Trade-in request not found", 404);

    // Validate state machine transition
    const allowedTransitions = VALID_TRANSITIONS[tradeIn.status];
    if (!allowedTransitions || !allowedTransitions.includes(status)) {
      return apiError("Chuyển trạng thái vi phạm State Machine", 400, "ERR_UI_090");
    }

    const updateData: Record<string, any> = {
      status,
      updatedAt: new Date(),
    };

    if (appraisedPrice) updateData.appraisedPrice = appraisedPrice;
    if (finalTradeInValue) updateData.finalTradeInValue = finalTradeInValue;
    if (status === "APPRAISING") updateData.assignedAppraiserId = token.sub;

    await db
      .update(tradeInRequests)
      .set(updateData)
      .where(eq(tradeInRequests.id, params.id));

    // Audit log
    await db.insert(auditLogs).values({
      actorType: "USER",
      actorUserId: token.sub,
      action: `TRADE_IN_STATUS_${status}`,
      entityType: "TRADE_IN_REQUEST",
      entityId: params.id,
      oldValue: { status: tradeIn.status },
      newValue: { status },
    });

    return apiSuccess({ message: `Trade-in status updated to ${status}` });
  } catch (error) {
    return apiError("Internal server error", 500);
  }
}
