export type BankDecision = "APPROVED" | "PARTIALLY_APPROVED" | "REJECTED";

export interface MockBankResponse {
  decision: BankDecision;
  approvedAmount: number | null;
  rejectionReason: string | null;
  processingTime: string;
}

export function simulateBankDecision(
  requestedAmount: number,
  decision: BankDecision
): MockBankResponse {
  switch (decision) {
    case "APPROVED":
      return {
        decision: "APPROVED",
        approvedAmount: requestedAmount,
        rejectionReason: null,
        processingTime: new Date().toISOString(),
      };
    case "PARTIALLY_APPROVED":
      return {
        decision: "PARTIALLY_APPROVED",
        approvedAmount: Math.floor(requestedAmount * 0.7),
        rejectionReason: null,
        processingTime: new Date().toISOString(),
      };
    case "REJECTED":
      return {
        decision: "REJECTED",
        approvedAmount: null,
        rejectionReason: "Hồ sơ chưa đạt điểm tín dụng tối thiểu (Dư nợ thẻ cao)",
        processingTime: new Date().toISOString(),
      };
  }
}
