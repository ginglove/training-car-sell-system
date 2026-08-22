import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { loanApplications, orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json();
    const { newBankName, reuseExistingDocs = true } = body;

    if (!newBankName) {
      return apiError("New bank name is required", 400);
    }

    const loanId = params.id;

    const [loan] = await db
      .select()
      .from(loanApplications)
      .where(eq(loanApplications.id, loanId))
      .limit(1);

    if (!loan) {
      return apiError("Loan application not found", 404);
    }

    if (loan.switchCount >= 3) {
      return apiError(
        "Maximum bank switches (3) exceeded",
        422,
        "ERR_UI_051"
      );
    }

    await db
      .update(loanApplications)
      .set({
        bankName: newBankName,
        switchCount: loan.switchCount + 1,
        status: "SUBMITTED",
        approvedLoanAmount: null,
        additionalCashNeeded: "0",
        rejectionReason: null,
        approvalLetterUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(loanApplications.id, loanId));

    await db
      .update(orders)
      .set({ status: "BANK_APPROVING", updatedAt: new Date() })
      .where(eq(orders.id, loan.orderId));

    return apiSuccess({
      message: `Bank switched to ${newBankName}`,
      switchCount: loan.switchCount + 1,
      remainingSwitches: 3 - (loan.switchCount + 1),
    });
  } catch (error: any) {
    return apiError(error.message || "Internal server error", 500);
  }
}
