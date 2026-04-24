/**
 * Módulo de queries de Denúncias de Conteúdo
 */
import { eq, desc } from "drizzle-orm";
import { contentReports } from "../../drizzle/schema";
import { getDb } from "./connection";

export async function createContentReport(data: {
  reporterId: number;
  contentType: "post" | "comment" | "user" | "image" | "other";
  contentId: string;
  reportType: "spam" | "harassment" | "false_info" | "inappropriate" | "copyright" | "other";
  reason: string;
  description?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(contentReports).values({
    ...data,
    severity: "0.5",
    status: "pending",
  });
}

export async function getPendingReports(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(contentReports)
    .where(eq(contentReports.status, "pending"))
    .orderBy(desc(contentReports.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getReportsByStatus(status: "pending" | "reviewing" | "resolved" | "dismissed", limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(contentReports)
    .where(eq(contentReports.status, status))
    .orderBy(desc(contentReports.createdAt))
    .limit(limit);
}

export async function updateReportStatus(
  reportId: number,
  status: "pending" | "reviewing" | "resolved" | "dismissed",
  moderatorId?: number,
  action?: string,
  notes?: string
) {
  const db = await getDb();
  if (!db) return null;
  return await db.update(contentReports)
    .set({
      status,
      moderatorId,
      moderatorAction: action,
      moderatorNotes: notes,
      resolvedAt: status !== "pending" ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(contentReports.id, reportId));
}

export async function getReportsByUser(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(contentReports)
    .where(eq(contentReports.reporterId, userId))
    .orderBy(desc(contentReports.createdAt))
    .limit(limit);
}

export async function getReportById(reportId: number) {
  const db = await getDb();
  if (!db) return null;
  const reports = await db.select().from(contentReports).where(eq(contentReports.id, reportId));
  return reports[0] || null;
}

export async function addVoteToReport(reportId: number) {
  const db = await getDb();
  if (!db) return null;
  const report = await getReportById(reportId);
  if (!report) return null;
  return await db.update(contentReports)
    .set({
      communityVotes: (report.communityVotes || 0) + 1,
      updatedAt: new Date(),
    })
    .where(eq(contentReports.id, reportId));
}
