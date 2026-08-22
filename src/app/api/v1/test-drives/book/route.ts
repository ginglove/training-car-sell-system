import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { testDriveSlots } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json();
    const { slotId, variantId, showroomId, driverName, driverPhone } = body;

    if (!slotId || !driverName || !driverPhone) {
      return apiError("Missing required fields", 400);
    }

    const phoneRegex = /^(0|84)[3|5|7|8|9][0-9]{8}$/;
    if (!phoneRegex.test(driverPhone)) {
      return apiError("Invalid phone number format", 400, "ERR_UI_031");
    }

    const [slot] = await db
      .select()
      .from(testDriveSlots)
      .where(and(eq(testDriveSlots.id, slotId), eq(testDriveSlots.isBooked, false)))
      .limit(1);

    if (!slot) {
      return apiError("Slot is no longer available", 409, "ERR_UI_030");
    }

    await db
      .update(testDriveSlots)
      .set({
        isBooked: true,
        assignedSaleId: session.user.role === "SALE" ? session.user.id : null,
      })
      .where(eq(testDriveSlots.id, slotId));

    return apiSuccess({ message: "Test drive booked successfully", slotId }, 201);
  } catch (error: any) {
    if (error.code === "23P01") {
      return apiError("Slot conflict - already booked", 409, "ERR_UI_030");
    }
    return apiError(error.message || "Internal server error", 500);
  }
}
