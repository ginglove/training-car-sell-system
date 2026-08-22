const MOCK_OTP = "888888";

export function sendMockOTP(phone: string): { success: boolean; message: string } {
  console.log(`[MOCK OTP] Sent OTP ${MOCK_OTP} to ${phone}`);
  return { success: true, message: "OTP sent successfully (Sandbox: 888888)" };
}

export function verifyMockOTP(code: string): boolean {
  return code === MOCK_OTP;
}
