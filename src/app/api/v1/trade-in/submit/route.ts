import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { tradeInRequests } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json();
    const { oldCarBrand, oldCarModel, manufacturingYear, odoKm, expectedPrice, orderId } = body;

    if (!oldCarBrand || !oldCarModel || !manufacturingYear || !odoKm || !expectedPrice) {
      return apiError("Missing required fields", 400, "ERR_UI_060");
    }

    const [tradeIn] = await db
      .insert(tradeInRequests)
      .values({
        orderId: orderId || null,
        customerId: session.user.id,
        oldCarBrand,
        oldCarModel,
        manufacturingYear,
        odoKm,
        expectedPrice: String(expectedPrice),
        status: "SUBMITTED",
      })
      .returning();

    return apiSuccess(tradeIn, 201);
  } catch (error: any) {
    return apiError(error.message || "Internal server error", 500);
  }
}
