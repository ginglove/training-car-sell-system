import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { vehicleTransfers, vehicles, showrooms } from "@/lib/db/schema";
import { eq, and, or } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return apiError("Forbidden", 403);
    }

    const transfers = await db
      .select()
      .from(vehicleTransfers)
      .orderBy(vehicleTransfers.createdAt);

    return apiSuccess(transfers);
  } catch (error: any) {
    return apiError(error.message || "Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return apiError("Forbidden", 403);
    }

    const body = await request.json();
    const { vinNumber, fromShowroomId, toShowroomId, logisticsFee = 0, reason } = body;

    if (!vinNumber || !fromShowroomId || !toShowroomId || !reason) {
      return apiError("Missing required fields", 400);
    }

    if (fromShowroomId === toShowroomId) {
      return apiError("Cannot transfer to same showroom", 400);
    }

    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.vinNumber, vinNumber), eq(vehicles.status, "AVAILABLE")))
      .limit(1);

    if (!vehicle) {
      return apiError("Vehicle not available for transfer", 409);
    }

    const transferCode = `TRF-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`;

    const [transfer] = await db
      .insert(vehicleTransfers)
      .values({
        transferCode,
        vinNumber,
        fromShowroomId,
        toShowroomId,
        logisticsFee: String(logisticsFee),
        requestedBy: session.user.id,
        status: "REQUESTED",
        reason,
      })
      .returning();

    await db
      .update(vehicles)
      .set({ status: "TRANSFERRING", updatedAt: new Date() })
      .where(eq(vehicles.vinNumber, vinNumber));

    return apiSuccess(transfer, 201);
  } catch (error: any) {
    return apiError(error.message || "Internal server error", 500);
  }
}
