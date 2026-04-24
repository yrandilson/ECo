/**
 * Módulo de queries de Gamificação — Rankings, Badges, Simulações, Alertas
 */
import { eq, desc } from "drizzle-orm";
import { users, simulations, alerts, badges, rankings, type InsertSimulation, type InsertAlert } from "../../drizzle/schema";
import { getDb } from "./connection";

// ==================== SIMULAÇÕES ====================

export async function createSimulation(data: InsertSimulation) {
  const db = await getDb();
  if (!db) return null;
  return await db.insert(simulations).values(data);
}

export async function getUserSimulations(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(simulations)
    .where(eq(simulations.userId, userId))
    .orderBy(desc(simulations.createdAt))
    .limit(limit);
}

// ==================== ALERTAS ====================

export async function createAlert(data: InsertAlert) {
  const db = await getDb();
  if (!db) return null;
  return await db.insert(alerts).values(data);
}

export async function getUserAlerts(userId: number, unreadOnly = false) {
  const db = await getDb();
  if (!db) return [];
  if (unreadOnly) {
    return await db.select().from(alerts)
      .where(eq(alerts.userId, userId))
      .orderBy(desc(alerts.createdAt));
  }
  return await db.select().from(alerts)
    .where(eq(alerts.userId, userId))
    .orderBy(desc(alerts.createdAt));
}

export async function markAlertAsRead(alertId: number) {
  const db = await getDb();
  if (!db) return null;
  return await db.update(alerts).set({ isRead: true }).where(eq(alerts.id, alertId));
}

// ==================== BADGES ====================

export async function awardBadge(userId: number, badgeType: string) {
  const db = await getDb();
  if (!db) return null;
  return await db.insert(badges).values({ userId, badgeType: badgeType as any });
}

export async function getUserBadges(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(badges).where(eq(badges.userId, userId));
}

// ==================== RANKINGS ====================

/**
 * Atualiza pontos do usuário e ranking — otimizado para usar userId diretamente
 */
export async function updateUserRanking(userId: number, pointsEarned: number) {
  const db = await getDb();
  if (!db) return null;

  // Atualizar pontos do usuário diretamente
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user) {
    await db.update(users)
      .set({ points: (user.points || 0) + pointsEarned })
      .where(eq(users.id, userId));
  }

  // Atualizar ou criar ranking
  const existingRanking = await db.select().from(rankings).where(eq(rankings.userId, userId)).limit(1);
  if (existingRanking.length > 0) {
    await db.update(rankings)
      .set({
        monthlyPoints: (existingRanking[0].monthlyPoints || 0) + pointsEarned,
        totalPoints: (existingRanking[0].totalPoints || 0) + pointsEarned,
      })
      .where(eq(rankings.userId, userId));
  } else {
    await db.insert(rankings).values({
      userId,
      monthlyPoints: pointsEarned,
      totalPoints: pointsEarned,
    });
  }
}

export async function getTopRankings(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(rankings).orderBy(desc(rankings.totalPoints)).limit(limit);
}

export async function getMonthlyTopRankings(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(rankings).orderBy(desc(rankings.monthlyPoints)).limit(limit);
}
