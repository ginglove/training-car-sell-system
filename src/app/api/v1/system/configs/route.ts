import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { discountPolicies, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) return apiError("Unauthorized", 401);

    const role = token.role as string;
    if (role !== "ADMIN") {
      return apiError("Forbidden", 403);
    }

    const policies = await db.select().from(discountPolicies);

    // Build config object from discount policies
    const configs = {
      defaultDepositAmount: "50000000",
      softLockTimeoutMinutes: 3,
      managerDiscountLimitPercent: policies.find(p => p.role === "MANAGER")?.maxDiscountPercentage || "5.00",
      adminDiscountLimitPercent: policies.find(p => p.role === "ADMIN")?.maxDiscountPercentage || "10.00",
      managerMaxDiscountAmount: policies.find(p => p.role === "MANAGER")?.maxDiscountAmount || "30000000",
      adminMaxDiscountAmount: policies.find(p => p.role === "ADMIN")?.maxDiscountAmount || "100000000",
      refundSlaDays: 3,
      vinHoldTimeoutHours: 24,
      maxBankSwitchCount: 3,
      maxLoanPercent: 80,
      policies,
    };

    return apiSuccess(configs);
  } catch (error) {
    return apiError("Internal server error", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) return apiError("Unauthorized", 401);

    const role = token.role as string;
    if (role !== "ADMIN") {
      return apiError("Forbidden", 403, "ERR_UI_101");
    }

    const body = await req.json();
    const { policyId, maxDiscountPercentage, maxDiscountAmount, isActive } = body;

    if (policyId) {
      // Update specific discount policy
      const [oldPolicy] = await db
        .select()
        .from(discountPolicies)
        .where(eq(discountPolicies.id, policyId))
        .limit(1);

      if (!oldPolicy) return apiError("Policy not found", 404);

      if (maxDiscountPercentage && parseFloat(maxDiscountPercentage) > 10) {
        return apiError("Chiết khấu vượt quá 10%", 400, "ERR_UI_100");
      }

      const updateData: Record<string, any> = {};
      if (maxDiscountPercentage !== undefined) updateData.maxDiscountPercentage = maxDiscountPercentage;
      if (maxDiscountAmount !== undefined) updateData.maxDiscountAmount = maxDiscountAmount;
      if (isActive !== undefined) updateData.isActive = isActive;

      await db.update(discountPolicies).set(updateData).where(eq(discountPolicies.id, policyId));

      // Audit log
      await db.insert(auditLogs).values({
        actorType: "USER",
        actorUserId: token.sub,
        action: "UPDATE_SYSTEM_CONFIG",
        entityType: "DISCOUNT_POLICY",
        entityId: policyId,
        oldValue: oldPolicy,
        newValue: updateData,
      });

      return apiSuccess({ message: "Config updated successfully" });
    }

    return apiError("No policy ID provided", 400);
  } catch (error) {
    return apiError("Internal server error", 500);
  }
}
