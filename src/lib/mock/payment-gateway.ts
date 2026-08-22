import { v4 as uuidv4 } from "uuid";

export type PaymentResult = "SUCCESS" | "PARTIAL_PAID" | "FAILED" | "EXPIRED";

export interface MockPaymentResponse {
  transactionRef: string;
  gatewayTransactionNo: string;
  status: PaymentResult;
  receivedAmount: number;
  responseCode: string;
  bankCode: string;
  payDate: string;
}

export function simulatePayment(
  amount: number,
  result: PaymentResult,
  partialAmount?: number
): MockPaymentResponse {
  const txnRef = `TXN-${Date.now()}-${uuidv4().slice(0, 8)}`;

  const receivedAmount =
    result === "SUCCESS"
      ? amount
      : result === "PARTIAL_PAID"
      ? partialAmount || Math.floor(amount * 0.5)
      : 0;

  return {
    transactionRef: txnRef,
    gatewayTransactionNo: `GW-${Date.now()}`,
    status: result,
    receivedAmount,
    responseCode: result === "SUCCESS" ? "00" : result === "FAILED" ? "99" : "01",
    bankCode: "MOCK_BANK",
    payDate: new Date().toISOString(),
  };
}

export function generateVietQRData(
  bankAccount: string,
  amount: number,
  orderCode: string
): string {
  return JSON.stringify({
    bankId: "970407",
    accountNo: bankAccount,
    amount,
    description: `Thanh toan coc ${orderCode}`,
    template: "compact2",
  });
}
