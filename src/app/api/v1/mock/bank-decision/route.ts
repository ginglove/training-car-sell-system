import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { loanApplications, orders, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { simulateBankDecision, type BankDecision } from "@/lib/mock/bank-decision";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) return apiError("Unauthorized", 401);

    const body = await req.json();
    const { loanApplicationId, decision } = body;

    if (!loanApplicationId || !decision) {
      return apiError("Loan application ID and decision are required", 400);
    }

    if (!["APPROVED", "PARTIALLY_APPROVED", "REJECTED"].includes(decision)) {
      return apiError("Invalid decision value", 400);
    }

    const [loan] = await db
      .select()
      .from(loanApplications)
      .where(eq(loanApplications.id, loanApplicationId))
      .limit(1);

    if (!loan) return apiError("Loan application not found", 404);

    const bankResponse = simulateBankDecision(
      parseFloat(loan.requestedLoanAmount),
      decision as BankDecision
    );

    // Update loan application
    const loanUpdate: Record<string, any> = {
      status: decision === "APPROVED" ? "APPROVED" : decision === "PARTIALLY_APPROVED" ? "PARTIALLY_APPROVED" : "REJECTED",
      updatedAt: new Date(),
    };

    if (bankResponse.approvedAmount !== null) {
      loanUpdate.approvedLoanAmount = bankResponse.approvedAmount.toString();
      if (decision === "PARTIALLY_APPROVED") {
        const remaining = parseFloat(loan.requestedLoanAmount) - bankResponse.approvedAmount;
        loanUpdate.additionalCashNeeded = remaining.toString();
      }
    }

    if (bankResponse.rejectionReason) {
      loanUpdate.rejectionReason = bankResponse.rejectionReason;
    }

    await db
      .update(loanApplications)
      .set(loanUpdate)
      .where(eq(loanApplications.id, loanApplicationId));

    // Update order status accordingly
    const orderStatusMap: Record<string, string> = {
      APPROVED: "BANK_APPROVED",
      PARTIALLY_APPROVED: "BANK_PARTIALLY_APPROVED",
      REJECTED: "BANK_REJECTED",
    };

    await db
      .update(orders)
      .set({
        status: orderStatusMap[decision] as any,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, loan.orderId));

    // Audit log
    await db.insert(auditLogs).values({
      actorType: "SYSTEM",
      actorUserId: token.sub,
      action: `MOCK_BANK_DECISION_${decision}`,
      entityType: "LOAN_APPLICATION",
      entityId: loanApplicationId,
      oldValue: { status: loan.status },
      newValue: { status: loanUpdate.status, bankResponse },
    });

    return apiSuccess({
      bankResponse,
      loanStatus: loanUpdate.status,
      message: `Mock bank decision: ${decision}`,
    });
  } catch (error) {
    return apiError("Internal server error", 500);
  }
}
