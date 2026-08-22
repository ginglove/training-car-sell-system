import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) return apiError("Unauthorized", 401);

    const role = token.role as string;
    if (role !== "ADMIN") return apiError("Forbidden", 403);

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        phone: users.phone,
        fullName: users.fullName,
        role: users.role,
        showroomId: users.showroomId,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.createdAt);

    return apiSuccess(allUsers);
  } catch (error) {
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) return apiError("Unauthorized", 401);

    const role = token.role as string;
    if (role !== "ADMIN") return apiError("Forbidden", 403);

    const body = await req.json();
    const { fullName, email, phone, role: newRole, showroomId, password } = body;

    if (!fullName || !email || !phone || !newRole) {
      return apiError("Missing required fields", 400);
    }

    const passwordHash = await hash(password || "Admin@123", 10);

    const [newUser] = await db
      .insert(users)
      .values({
        fullName,
        email,
        phone,
        role: newRole as any,
        showroomId: showroomId || null,
        passwordHash,
      })
      .returning();

    return apiSuccess(newUser, 201);
  } catch (error: any) {
    if (error?.message?.includes("unique")) {
      return apiError("Email hoặc SĐT đã tồn tại", 409);
    }
    return apiError("Internal server error", 500);
  }
}
