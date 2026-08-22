import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { crmLeads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

const VALID_STATUSES = ["NEW", "CONTACTED", "TEST_DRIVE_BOOKED", "NEGOTIATING", "WON", "LOST"];
const VALID_TRANSITIONS: Record<string, string[]> = {
  NEW: ["CONTACTED", "LOST"],
  CONTACTED: ["TEST_DRIVE_BOOKED", "NEGOTIATING", "LOST"],
  TEST_DRIVE_BOOKED: ["NEGOTIATING", "LOST"],
  NEGOTIATING: ["WON", "LOST"],
  WON: [],
  LOST: [],
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "MANAGER", "SALE"].includes(session.user.role)) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json();
    const { newStatus, lostReason } = body;

    if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
      return apiError("Invalid status", 400);
    }

    const [lead] = await db
      .select()
      .from(crmLeads)
      .where(eq(crmLeads.id, params.id))
      .limit(1);

    if (!lead) {
      return apiError("Lead not found", 404);
    }

    const allowed = VALID_TRANSITIONS[lead.leadStatus];
    if (!allowed?.includes(newStatus)) {
      return apiError(
        `Cannot transition from ${lead.leadStatus} to ${newStatus}`,
        422,
        "ERR_UI_090"
      );
    }

    const updateData: any = {
      leadStatus: newStatus,
      updatedAt: new Date(),
    };

    if (newStatus === "LOST" && lostReason) {
      updateData.lostReason = lostReason;
    }

    const [updated] = await db
      .update(crmLeads)
      .set(updateData)
      .where(eq(crmLeads.id, params.id))
      .returning();

    return apiSuccess(updated);
  } catch (error: any) {
    return apiError(error.message || "Internal server error", 500);
  }
}
