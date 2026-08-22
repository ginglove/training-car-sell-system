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
    const { fullName, email, identityCardNumber, identityCardDate, identityCardPlace, permanentAddress, monthlyIncome } = body;

    // Update users table
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;

    await db.update(users).set(updateData).where(eq(users.id, userId));

    // Upsert customer_profiles if CCCD data provided
    if (identityCardNumber || permanentAddress || monthlyIncome) {
      const [existing] = await db
        .select()
        .from(customerProfiles)
        .where(eq(customerProfiles.userId, userId))
        .limit(1);

      const profileData: Record<string, any> = { updatedAt: new Date() };
      if (identityCardNumber) {
        profileData.identityCardNumber = mockEncrypt(identityCardNumber);
        profileData.identityCardMasked = maskCCCD(identityCardNumber);
      }
      if (identityCardDate) profileData.identityCardDate = identityCardDate;
      if (identityCardPlace) profileData.identityCardPlace = identityCardPlace;
      if (permanentAddress) profileData.permanentAddress = permanentAddress;
      if (monthlyIncome) profileData.monthlyIncome = monthlyIncome;

      if (existing) {
        await db.update(customerProfiles).set(profileData).where(eq(customerProfiles.userId, userId));
      } else {
        await db.insert(customerProfiles).values({
          userId: userId,
          identityCardNumber: profileData.identityCardNumber || mockEncrypt("000000000000"),
          identityCardMasked: profileData.identityCardMasked || "00000000****",
          identityCardDate: profileData.identityCardDate || new Date().toISOString().split("T")[0],
          identityCardPlace: profileData.identityCardPlace || "",
          permanentAddress: profileData.permanentAddress || "",
          monthlyIncome: profileData.monthlyIncome,
        });
      }
    }

    return apiSuccess({ message: "Profile updated successfully" });
  } catch (error) {
    return apiError("Internal server error", 500);
  }
}
