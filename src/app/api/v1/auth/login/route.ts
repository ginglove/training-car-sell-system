import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { compare } from "bcryptjs";
import { encode } from "next-auth/jwt";
import { verifyMockOTP } from "@/lib/mock/otp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identity, password, otp, mode = "password" } = body;

    if (!identity) {
      return NextResponse.json(
        { success: false, error: { code: "ERR_VALIDATION", message: "Vui lòng cung cấp Email hoặc Số điện thoại (identity)" } },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, identity), eq(users.phone, identity)))
      .limit(1);

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: { code: "ERR_UI_003", message: "Tài khoản không tồn tại hoặc đã bị vô hiệu hóa" } },
        { status: 401 }
      );
    }

    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return NextResponse.json(
        { success: false, error: { code: "ERR_UI_004", message: "Tài khoản bị tạm khóa 30 phút do nhập sai quá 5 lần" } },
        { status: 401 }
      );
    }

    if (mode === "otp") {
      if (!otp || !verifyMockOTP(otp)) {
        return NextResponse.json(
          { success: false, error: { code: "ERR_UI_005", message: "Mã OTP không hợp lệ hoặc đã hết hạn (Sandbox code: 888888)" } },
          { status: 400 }
        );
      }
    } else {
      if (!password) {
        return NextResponse.json(
          { success: false, error: { code: "ERR_VALIDATION", message: "Vui lòng nhập mật khẩu" } },
          { status: 400 }
        );
      }

      const isValid = await compare(password, user.passwordHash);
      if (!isValid) {
        const attempts = (user.failedLoginAttempts || 0) + 1;
        await db
          .update(users)
          .set({
            failedLoginAttempts: attempts,
            lockedUntil: attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null,
          })
          .where(eq(users.id, user.id));

        return NextResponse.json(
          { success: false, error: { code: "ERR_UI_003", message: "Mật khẩu không chính xác" } },
          { status: 401 }
        );
      }
    }

    // Reset failed login counter on success
    await db
      .update(users)
      .set({ failedLoginAttempts: 0, lockedUntil: null })
      .where(eq(users.id, user.id));

    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "autodealer-secret-key-production-2026";
    const isProduction = process.env.NODE_ENV === "production";
    const salt = isProduction ? "__Secure-authjs.session-token" : "authjs.session-token";

    const sessionPayload = {
      sub: user.id,
      email: user.email,
      name: user.fullName,
      role: user.role,
      showroomId: user.showroomId,
      phone: user.phone,
    };

    const token = await encode({
      token: sessionPayload,
      secret,
      salt,
      maxAge: 24 * 60 * 60,
    });

    const res = NextResponse.json(
      {
        success: true,
        data: {
          message: "Đăng nhập thành công",
          token,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role,
            showroomId: user.showroomId,
          },
        },
      },
      { status: 200 }
    );

    // Set NextAuth session cookie for browser sessions
    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      secure: isProduction,
      maxAge: 24 * 60 * 60,
    };

    res.cookies.set("authjs.session-token", token, cookieOptions);
    res.cookies.set("next-auth.session-token", token, cookieOptions);

    return res;
  } catch (err: any) {
    console.error("Login API Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "ERR_SERVER", message: err.message || "Lỗi máy chủ nội bộ" } },
      { status: 500 }
    );
  }
}
