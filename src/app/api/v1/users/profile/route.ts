import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users, customerProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { mockEncrypt, maskCCCD } from "@/lib/mock/kms";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("Unauthorized", 401);
    const userId = (session.user as any).id;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return apiError("User not found", 404);

    const [profile] = await db
      .select()
      .from(customerProfiles)
      .where(eq(customerProfiles.userId, userId))
      .limit(1);

    return apiSuccess({
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      showroomId: user.showroomId,
      identityCardMasked: profile?.identityCardMasked || null,
      identityCardDate: profile?.identityCardDate || null,
      identityCardPlace: profile?.identityCardPlace || null,
      permanentAddress: profile?.permanentAddress || null,
      monthlyIncome: profile?.monthlyIncome || null,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return apiError("Internal server error", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("Unauthorized", 401);
    const userId = (session.user as any).id;

    const body = await req.json();
    const {
      fullName,
      email,
      showroomId,
      identityCardNumber,
      identityCardDate,
      identityCardPlace,
      permanentAddress,
      monthlyIncome,
    } = body;

    // Field Validations
    if (fullName) {
      if (fullName.trim().length < 2 || fullName.trim().length > 100) {
        return apiError("Họ và tên phải từ 2 đến 100 ký tự", 400, "ERR_UI_048");
      }
    }

    if (permanentAddress) {
      if (permanentAddress.trim().length < 10 || permanentAddress.trim().length > 255) {
        return apiError("Địa chỉ HKTT phải từ 10 đến 255 ký tự", 400, "ERR_UI_048");
      }
    }

    if (identityCardDate) {
      const issueDate = new Date(identityCardDate);
      if (issueDate > new Date()) {
        return apiError("Ngày cấp CCCD không thể lớn hơn ngày hiện tại", 400, "ERR_UI_048");
      }
    }

    let encryptedCCCD: string | null = null;
    let maskedCCCD: string | null = null;

    if (identityCardNumber && !identityCardNumber.includes("*")) {
      if (!/^[0-9]{12}$/.test(identityCardNumber)) {
        return apiError("Số CCCD phải bao gồm đúng 12 chữ số theo chuẩn", 400, "ERR_UI_048");
      }
      encryptedCCCD = mockEncrypt(identityCardNumber);
      maskedCCCD = maskCCCD(identityCardNumber);

      // Check 409 Conflict: Duplicate CCCD in customer_profiles
      const [duplicate] = await db
        .select()
        .from(customerProfiles)
        .where(eq(customerProfiles.identityCardMasked, maskedCCCD))
        .limit(1);

      if (duplicate && duplicate.userId !== userId) {
        return apiError("Số CCCD đã được đăng ký bởi một tài khoản khác trong hệ thống", 409, "ERR_UI_049");
      }
    }

    // Update users table
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (fullName) updateData.fullName = fullName.trim();
    if (email) updateData.email = email.trim();
    if (showroomId) updateData.showroomId = showroomId;

    await db.update(users).set(updateData).where(eq(users.id, userId));

    // Upsert customer_profiles if CCCD data provided
    if (identityCardNumber || permanentAddress || monthlyIncome || identityCardDate || identityCardPlace) {
      const [existing] = await db
        .select()
        .from(customerProfiles)
        .where(eq(customerProfiles.userId, userId))
        .limit(1);

      const profileData: Record<string, any> = { updatedAt: new Date() };
      if (encryptedCCCD && maskedCCCD) {
        profileData.identityCardNumber = encryptedCCCD;
        profileData.identityCardMasked = maskedCCCD;
      }
      if (identityCardDate) profileData.identityCardDate = identityCardDate;
      if (identityCardPlace) profileData.identityCardPlace = identityCardPlace;
      if (permanentAddress) profileData.permanentAddress = permanentAddress.trim();
      if (monthlyIncome !== undefined) profileData.monthlyIncome = String(monthlyIncome);

      if (existing) {
        await db.update(customerProfiles).set(profileData).where(eq(customerProfiles.userId, userId));
      } else {
        await db.insert(customerProfiles).values({
          userId: userId,
          identityCardNumber: profileData.identityCardNumber || mockEncrypt("000000000000"),
          identityCardMasked: profileData.identityCardMasked || "00000000****",
          identityCardDate: profileData.identityCardDate || new Date().toISOString().split("T")[0],
          identityCardPlace: profileData.identityCardPlace || "Cục CSQLHC về TTXH",
          permanentAddress: profileData.permanentAddress || "",
          monthlyIncome: profileData.monthlyIncome || null,
        });
      }
    }

    return apiSuccess({ message: "Cập nhật hồ sơ cá nhân thành công!" });
  } catch (error) {
    return apiError("Internal server error", 500);
  }
}
