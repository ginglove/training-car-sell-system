import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { vehicles, vinHoldReservations, vehicleQuotas } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return apiError("Forbidden - Manager or Admin only", 403);
    }

    const body = await request.json();
    const { vinNumber, customerPhone, customerName, holdReason } = body;

    if (!vinNumber || !customerPhone || !customerName || !holdReason) {
      return apiError("Missing required fields", 400);
    }

    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.vinNumber, vinNumber), eq(vehicles.status, "AVAILABLE")))
      .limit(1);

    if (!vehicle) {
      return apiError("VIN not available for hold", 409, "ERR_UI_080");
    }

    const holdExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db
      .update(vehicles)
      .set({
        status: "LOCKED",
        lockedUntil: holdExpires,
        reservedForPhone: customerPhone,
        updatedAt: new Date(),
      })
      .where(eq(vehicles.vinNumber, vinNumber));

    await db.execute(sql`
      UPDATE vehicle_quotas
      SET soft_locked_count = soft_locked_count + 1
      WHERE variant_id = ${vehicle.variantId}
        AND color = ${vehicle.color}
        AND showroom_id = ${vehicle.showroomId}
        AND soft_locked_count < total_physical_count
    `);

    const [hold] = await db
      .insert(vinHoldReservations)
      .values({
        vinNumber,
        heldByManagerId: session.user.id,
        customerPhone,
        customerName,
        holdReason,
        holdExpiresAt: holdExpires,
        isActive: true,
      })
      .returning();

    return apiSuccess(hold, 201);
  } catch (error: any) {
    if (error.code === "23505") {
      return apiError("VIN already has an active hold", 409, "ERR_UI_080");
    }
    return apiError(error.message || "Internal server error", 500);
  }
}
