import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { customerProfiles, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { mockDecrypt } from "@/lib/mock/kms";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) return apiError("Unauthorized", 401);

    const role = token.role as string;
    if (role !== "ADMIN") {
      return apiError("Không có quyền decrypt PII", 403, "ERR_UI_101");
    }

    const body = await req.json();
    const { userId, fields } = body;

    if (!userId) return apiError("User ID is required", 400);

    const [profile] = await db
      .select()
      .from(customerProfiles)
      .where(eq(customerProfiles.userId, userId))
      .limit(1);

    if (!profile) return apiError("Profile not found", 404);

    const decryptedFields: Record<string, string> = {};
    const requestedFields = fields || ["identityCardNumber"];

    for (const field of requestedFields) {
      if (field === "identityCardNumber" && profile.identityCardNumber) {
        decryptedFields.identityCardNumber = mockDecrypt(profile.identityCardNumber);
      }
    }

    // Audit the decryption
    await db.insert(auditLogs).values({
      actorType: "USER",
      actorUserId: token.sub,
      action: "DECRYPT_PII",
      entityType: "CUSTOMER_PROFILE",
      entityId: profile.id,
      newValue: { fields: requestedFields, targetUserId: userId },
    });

    return apiSuccess(decryptedFields);
  } catch (error) {
    return apiError("Internal server error", 500);
  }
}
