import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { compare, hash } from "bcryptjs";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function PUT(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) return apiError("Unauthorized", 401);

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return apiError("Current password and new password are required", 400);
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return apiError("Mật khẩu tối thiểu 8 ký tự, gồm 1 chữ hoa và 1 số", 400, "ERR_UI_002");
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, token.sub))
      .limit(1);

    if (!user) return apiError("User not found", 404);

    const isValid = await compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return apiError("Current password is incorrect", 401, "ERR_UI_003");
    }

    const newHash = await hash(newPassword, 10);
    await db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, token.sub));

    return apiSuccess({ message: "Password changed successfully" });
  } catch (error) {
    return apiError("Internal server error", 500);
  }
}
