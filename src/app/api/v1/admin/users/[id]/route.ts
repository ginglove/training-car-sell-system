import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) return apiError("Unauthorized", 401);

    const role = token.role as string;
    if (role !== "ADMIN") return apiError("Forbidden", 403);

    const body = await req.json();
    const updateData: Record<string, any> = { updatedAt: new Date() };

    if (body.fullName !== undefined) updateData.fullName = body.fullName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.showroomId !== undefined) updateData.showroomId = body.showroomId || null;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    await db.update(users).set(updateData).where(eq(users.id, params.id));

    return apiSuccess({ message: "User updated successfully" });
  } catch (error) {
    return apiError("Internal server error", 500);
  }
}
