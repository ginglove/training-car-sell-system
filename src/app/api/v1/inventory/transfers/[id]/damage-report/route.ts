import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { vehicleTransfers, vehicles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return apiError("Forbidden", 403);
    }

    const body = await request.json();
    const { damageNotes } = body;

    if (!damageNotes) {
      return apiError("Damage notes are required", 400);
    }

    const [transfer] = await db
      .select()
      .from(vehicleTransfers)
      .where(eq(vehicleTransfers.id, params.id))
      .limit(1);

    if (!transfer) {
      return apiError("Transfer not found", 404);
    }

    if (transfer.status !== "IN_TRANSIT") {
      return apiError("Transfer must be in IN_TRANSIT status", 422);
    }

    await db
      .update(vehicleTransfers)
      .set({
        status: "TRANSIT_DAMAGED",
        transferTransitDamageNotes: damageNotes,
        completedAt: new Date(),
      })
      .where(eq(vehicleTransfers.id, params.id));

    await db
      .update(vehicles)
      .set({
        status: "AVAILABLE",
        showroomId: transfer.fromShowroomId,
        updatedAt: new Date(),
      })
      .where(eq(vehicles.vinNumber, transfer.vinNumber));

    return apiSuccess({ message: "Damage report submitted, VIN rolled back to source showroom" });
  } catch (error: any) {
    return apiError(error.message || "Internal server error", 500);
  }
}
