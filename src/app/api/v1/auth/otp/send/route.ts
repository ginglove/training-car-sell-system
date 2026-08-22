import { NextRequest } from "next/server";
import { sendMockOTP } from "@/lib/mock/otp";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return apiError("Phone number is required", 400, "ERR_UI_031");
    }

    const phoneRegex = /^(0|84)[3|5|7|8|9][0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      return apiError("Invalid phone number format", 400, "ERR_UI_031");
    }

    const result = sendMockOTP(phone);
    return apiSuccess(result);
  } catch (error: any) {
    return apiError(error.message || "Internal server error", 500);
  }
}
