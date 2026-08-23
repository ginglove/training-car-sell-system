import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { hash } from "bcryptjs";
import { verifyMockOTP } from "@/lib/mock/otp";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identity, otp, newPassword } = body;

    if (!identity || !otp || !newPassword) {
      return apiError("Thiếu thông tin bắt buộc", 400);
    }

    if (!verifyMockOTP(otp)) {
      return apiError("Mã OTP không hợp lệ hoặc đã hết hạn", 400, "ERR_UI_005");
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
    if (!passwordRegex.test(newPassword)) {
      return apiError("Mật khẩu tối thiểu 10 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (@$!%*?&)", 400, "ERR_UI_002");
    }

    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, identity), eq(users.phone, identity)))
      .limit(1);

    if (!user) {
      return apiError("Không tìm thấy tài khoản với Email/SĐT này", 404, "ERR_UI_003");
    }

    const newHash = await hash(newPassword, 10);
    await db
      .update(users)
      .set({
        passwordHash: newHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return apiSuccess({ message: "Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại." });
  } catch (error: any) {
    return apiError(error.message || "Internal server error", 500);
  }
}
