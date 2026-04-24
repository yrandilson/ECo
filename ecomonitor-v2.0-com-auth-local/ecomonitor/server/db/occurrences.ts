/**
 * Módulo de queries de Ocorrências, Fotos e Validações
 */
import { eq, desc, sql } from "drizzle-orm";
import { occurrences, photos, validations, type InsertOccurrence, type InsertValidation } from "../../drizzle/schema";
import { getDb } from "./connection";

// ==================== OCORRÊNCIAS ====================

export async function createOccurrence(data: InsertOccurrence) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(occurrences).values(data);
}

export async function getOccurrenceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(occurrences).where(eq(occurrences.id, id)).limit(1);
  return result[0];
}

export async function getOccurrencesByType(type: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(occurrences)
    .where(eq(occurrences.type, type as any))
    .orderBy(desc(occurrences.createdAt))
    .limit(limit);
}

export async function getRecentOccurrences(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(occurrences)
    .orderBy(desc(occurrences.createdAt))
    .limit(limit);
}

export async function updateOccurrenceRiskScore(occurrenceId: number, riskScore: number) {
  const db = await getDb();
  if (!db) return null;
  return await db.update(occurrences)
    .set({ riskScore: riskScore as any })
    .where(eq(occurrences.id, occurrenceId));
}

export async function getCriticalOccurrences(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(occurrences)
    .where(eq(occurrences.severity, "critical"))
    .orderBy(desc(occurrences.createdAt))
    .limit(limit);
}

export async function getOccurrencesByStatus(status: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(occurrences)
    .where(eq(occurrences.status, status as any))
    .orderBy(desc(occurrences.createdAt))
    .limit(limit);
}

/**
 * Estatísticas de ocorrências otimizadas — usa SQL COUNT/GROUP BY
 * em vez de carregar todas as linhas na memória
 */
export async function getOccurrenceStats() {
  const db = await getDb();
  if (!db) return null;

  // Total
  const [totalResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(occurrences);
  const total = totalResult?.count ?? 0;

  // Por tipo (SQL GROUP BY)
  const byTypeResult = await db
    .select({
      type: occurrences.type,
      count: sql<number>`COUNT(*)`,
    })
    .from(occurrences)
    .groupBy(occurrences.type);

  // Por severidade (SQL GROUP BY)
  const bySeverityResult = await db
    .select({
      severity: occurrences.severity,
      count: sql<number>`COUNT(*)`,
    })
    .from(occurrences)
    .groupBy(occurrences.severity);

  // Validados
  const [validatedResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(occurrences)
    .where(eq(occurrences.status, "validated"));
  const validated = validatedResult?.count ?? 0;

  // Críticos
  const [criticalResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(occurrences)
    .where(eq(occurrences.severity, "critical"));
  const critical = criticalResult?.count ?? 0;

  return {
    total,
    validated,
    critical,
    byType: byTypeResult.map((r) => [r.type, r.count]),
    bySeverity: bySeverityResult.map((r) => [r.severity, r.count]),
  };
}

// ==================== FOTOS ====================

export async function addPhotos(occurrenceId: number, photoUrls: string[]) {
  const db = await getDb();
  if (!db) return [];
  const values = photoUrls.map((url) => ({ occurrenceId, photoUrl: url }));
  return await db.insert(photos).values(values);
}

export async function getPhotosByOccurrence(occurrenceId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(photos).where(eq(photos.occurrenceId, occurrenceId));
}

// ==================== VALIDAÇÕES ====================

export async function createValidation(data: InsertValidation) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(validations).values(data);

  // Atualizar contadores na ocorrência
  const occurrence = await getOccurrenceById(data.occurrenceId);
  if (occurrence) {
    const validationCount = (occurrence.communityValidations || 0) + (data.isValid ? 1 : 0);
    const rejectionCount = (occurrence.communityRejections || 0) + (!data.isValid ? 1 : 0);
    await db.update(occurrences)
      .set({ communityValidations: validationCount, communityRejections: rejectionCount })
      .where(eq(occurrences.id, data.occurrenceId));
  }
}

export async function getValidationsByOccurrence(occurrenceId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(validations).where(eq(validations.occurrenceId, occurrenceId));
}
