import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { compare, hash } from "bcryptjs";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("Unauthorized", 401);
    const userId = (session.user as any).id;

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return apiError("Current password and new password are required", 400);
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/;
    if (!passwordRegex.test(newPassword)) {
      return apiError("Mật khẩu tối thiểu 10 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (@$!%*?&)", 400, "ERR_UI_002");
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return apiError("User not found", 404);

    const isValid = await compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return apiError("Mật khẩu hiện tại không chính xác", 401, "ERR_UI_003");
    }

    const newHash = await hash(newPassword, 10);
    await db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return apiSuccess({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    return apiError("Internal server error", 500);
  }
}
