import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";
import { eq, desc, and, gte, lte, like, sql } from "drizzle-orm";
import { apiSuccess, apiError } from "@/lib/utils/api-response";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) return apiError("Unauthorized", 401);

    const role = token.role as string;
    if (role !== "ADMIN") {
      return apiError("Forbidden", 403);
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");
    const correlationId = searchParams.get("correlationId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const offset = (page - 1) * limit;

    const conditions = [];
    if (action) conditions.push(like(auditLogs.action, `%${action}%`));
    if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
    if (correlationId) conditions.push(eq(auditLogs.correlationId, correlationId));
    if (dateFrom) conditions.push(gte(auditLogs.createdAt, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(auditLogs.createdAt, new Date(dateTo)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const logs = await db
      .select({
        id: auditLogs.id,
        actorType: auditLogs.actorType,
        actorUserId: auditLogs.actorUserId,
        actorName: users.fullName,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        oldValue: auditLogs.oldValue,
        newValue: auditLogs.newValue,
        correlationId: auditLogs.correlationId,
        ipAddress: auditLogs.ipAddress,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorUserId, users.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(whereClause);

    return apiSuccess({
      logs,
      pagination: {
        page,
        limit,
        total: Number(countResult?.count || 0),
        totalPages: Math.ceil(Number(countResult?.count || 0) / limit),
      },
    });
  } catch (error) {
    return apiError("Internal server error", 500);
  }
}
