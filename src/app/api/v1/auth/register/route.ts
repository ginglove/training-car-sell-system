import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, customerProfiles } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import hashPassword from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, phone, password, otpCode } = body;

    if (!fullName || !email || !phone || !password || !otpCode) {
      return NextResponse.json(
        { success: false, error: { code: "ERR_VALIDATION", message: "Vui lòng điền đầy đủ các trường bắt buộc (Họ tên, Email, SĐT, Mật khẩu, OTP)" } },
        { status: 400 }
      );
    }

    // 1. Full name validation (min 2, max 100)
    const trimmedName = fullName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return NextResponse.json(
        { success: false, error: { code: "ERR_REG_003", message: "Họ và tên phải từ 2 đến 100 ký tự", details: [{ field: "fullName", msg: "Độ dài 2-100 ký tự" }] } },
        { status: 422 }
      );
    }

    // 2. Email RFC5322 validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: { code: "ERR_REG_003", message: "Định dạng Email không hợp lệ", details: [{ field: "email", msg: "Email không đúng định dạng RFC5322" }] } },
        { status: 422 }
      );
    }

    // 3. Phone VN regex validation: ^(0|84)[35789][0-9]{8}$ (C1.1 Fix)
    const phoneRegex = /^(0|84)[35789][0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, error: { code: "ERR_REG_003", message: "Số điện thoại Việt Nam không hợp lệ", details: [{ field: "phone", msg: "SĐT phải bắt đầu bằng 03, 05, 07, 08, 09 và gồm 10 chữ số" }] } },
        { status: 422 }
      );
    }

    // 4. Password complexity validation (C1.2 Fix: min 10, 1 hoa, 1 thường, 1 số, 1 đặc biệt)
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { success: false, error: { code: "ERR_REG_003", message: "Mật khẩu không đủ mạnh", details: [{ field: "password", msg: "Min 10 ký tự, 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt (@$!%*?&)" }] } },
        { status: 422 }
      );
    }

    // 5. OTP check (C1.5 Fix: Sandbox code 888888)
    if (otpCode !== "888888") {
      return NextResponse.json(
        { success: false, error: { code: "ERR_REG_002", message: "Mã OTP không đúng hoặc đã hết hạn (Sandbox code: 888888)" } },
        { status: 400 }
      );
    }

    // Check duplicate
    const existingUser = await db.select().from(users).where(or(eq(users.email, email), eq(users.phone, phone))).limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, error: { code: "ERR_REG_001", message: "Email hoặc số điện thoại này đã được đăng ký trước đó" } },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword.hash(password, 10);

    const [newUser] = await db.insert(users).values({
      email,
      phone,
      passwordHash: hashedPassword,
      fullName,
      role: "CUSTOMER",
    }).returning();

    // Create customer profile stub
    await db.insert(customerProfiles).values({
      userId: newUser.id,
      identityCardNumber: "000000000000",
      identityCardMasked: "0000****0000",
      identityCardDate: "2020-01-01",
      identityCardPlace: "Chưa cập nhật",
      permanentAddress: "Chưa cập nhật",
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Đăng ký tài khoản thành công",
          user: {
            id: newUser.id,
            email: newUser.email,
            phone: newUser.phone,
            fullName: newUser.fullName,
            role: newUser.role,
          },
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Register Error:", err);
    return NextResponse.json(
      { success: false, error: { code: "ERR_SERVER", message: err.message || "Lỗi máy chủ" } },
      { status: 500 }
    );
  }
}
