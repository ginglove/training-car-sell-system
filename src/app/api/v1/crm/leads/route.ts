import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { crmLeads, vehicleVariants } from "@/lib/db/schema";
import { eq, and, ilike, sql } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "MANAGER", "SALE"].includes(session.user.role)) {
      return apiError("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const conditions: any[] = [];

    if (session.user.role === "SALE") {
      conditions.push(eq(crmLeads.assignedSaleId, session.user.id));
    } else if (session.user.role === "MANAGER") {
      // Manager sees all leads in showroom - for simplicity, show all assigned leads
    }

    if (status) {
      conditions.push(eq(crmLeads.leadStatus, status as any));
    }

    if (search) {
      conditions.push(
        sql`(${ilike(crmLeads.customerName, `%${search}%`)} OR ${ilike(crmLeads.phone, `%${search}%`)})`
      );
    }

    const leads = await db
      .select({
        id: crmLeads.id,
        customerName: crmLeads.customerName,
        phone: crmLeads.phone,
        email: crmLeads.email,
        interestedVariantId: crmLeads.interestedVariantId,
        assignedSaleId: crmLeads.assignedSaleId,
        leadStatus: crmLeads.leadStatus,
        leadScore: crmLeads.leadScore,
        lostReason: crmLeads.lostReason,
        createdAt: crmLeads.createdAt,
        updatedAt: crmLeads.updatedAt,
        variantName: vehicleVariants.variantName,
      })
      .from(crmLeads)
      .leftJoin(vehicleVariants, eq(crmLeads.interestedVariantId, vehicleVariants.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(crmLeads.updatedAt);

    return apiSuccess(leads);
  } catch (error: any) {
    return apiError(error.message || "Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "MANAGER", "SALE"].includes(session.user.role)) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json();
    const { customerName, phone, email, interestedVariantId, leadScore = 10 } = body;

    if (!customerName || !phone) {
      return apiError("Customer name and phone are required", 400);
    }

    const [lead] = await db
      .insert(crmLeads)
      .values({
        customerName,
        phone,
        email,
        interestedVariantId,
        assignedSaleId: session.user.role === "SALE" ? session.user.id : null,
        leadStatus: "NEW",
        leadScore,
      })
      .returning();

    return apiSuccess(lead, 201);
  } catch (error: any) {
    return apiError(error.message || "Internal server error", 500);
  }
}
