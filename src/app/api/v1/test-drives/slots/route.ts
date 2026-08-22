import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { testDriveSlots } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

const STANDARD_SLOT_HOURS = [
  { start: "08:00", end: "09:00" },
  { start: "09:00", end: "10:00" },
  { start: "10:00", end: "11:00" },
  { start: "11:00", end: "12:00" },
  { start: "13:30", end: "14:30" },
  { start: "14:30", end: "15:30" },
  { start: "15:30", end: "16:30" },
  { start: "16:30", end: "17:30" },
];

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

    let slots = await db
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

    // Auto-generate standard slots for this showroom and date if none exist
    if (slots.length === 0) {
      const newSlots = STANDARD_SLOT_HOURS.map((h) => ({
        showroomId,
        slotStart: new Date(`${date}T${h.start}:00+07:00`),
        slotEnd: new Date(`${date}T${h.end}:00+07:00`),
        isBooked: false,
      }));

      await db.insert(testDriveSlots).values(newSlots);

      slots = await db
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
    }

    return apiSuccess(slots);
  } catch (error: any) {
    return apiError(error.message || "Internal server error", 500);
  }
}
