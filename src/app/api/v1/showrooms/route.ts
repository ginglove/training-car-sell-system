import { db } from "@/lib/db";
import { showrooms } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function GET() {
  try {
    const results = await db
      .select()
      .from(showrooms)
      .where(eq(showrooms.isActive, true))
      .orderBy(showrooms.name);

    return apiSuccess(results);
  } catch (error: any) {
    return apiError(error.message || "Internal server error", 500);
  }
}
