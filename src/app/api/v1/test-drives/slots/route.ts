import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { testDriveSlots, showrooms, vehicleVariants } from "@/lib/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showroomId = searchParams.get("showroom_id");
    const date = searchParams.get("date");

    if (!showroomId || !date) {
      return apiError("showroom_id and date are required", 400);
    }

    const dayStart = new Date(`${date}T00:00:00+07:00`);
    const dayEnd = new Date(`${date}T23:59:59+07:00`);

    const slots = await db
      .select({
        id: testDriveSlots.id,
        slotStart: testDriveSlots.slotStart,
        slotEnd: testDriveSlots.slotEnd,
        isBooked: testDriveSlots.isBooked,
        variantId: testDriveSlots.variantId,
        showroomId: testDriveSlots.showroomId,
      })
      .from(testDriveSlots)
      .where(
        and(
          eq(testDriveSlots.showroomId, showroomId),
          gte(testDriveSlots.slotStart, dayStart),
          lte(testDriveSlots.slotEnd, dayEnd)
        )
      )
      .orderBy(testDriveSlots.slotStart);

    return apiSuccess(slots);
  } catch (error: any) {
    return apiError(error.message || "Internal server error", 500);
  }
}
