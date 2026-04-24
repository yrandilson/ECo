/**
 * Módulo de queries de Usuários
 */
import { eq } from "drizzle-orm";
import { users, type InsertUser } from "../../drizzle/schema";
import { getDb } from "./connection";
import { ENV } from "../_core/env";

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createLocalUser(data: {
  email: string;
  passwordHash: string;
  name: string;
  loginMethod: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(users).values({
    email: data.email,
    passwordHash: data.passwordHash,
    name: data.name,
    loginMethod: data.loginMethod,
    openId: `local_${Date.now()}`,
    lastSignedIn: new Date(),
  });

  const user = await getUserByEmail(data.email);
  if (!user) throw new Error("Failed to retrieve created user");
  return user;
}

export async function updateUserLastSignIn(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}

// ==================== PASSWORD RESET ====================

export async function savePasswordResetToken(userId: number, token: string, expiresIn24Hours: boolean = true) {
  const db = await getDb();
  if (!db) return null;

  const expiresAt = new Date();
  if (expiresIn24Hours) {
    expiresAt.setTime(expiresAt.getTime() + 24 * 60 * 60 * 1000);
  }

  return await db.update(users)
    .set({ resetToken: token, resetTokenExpires: expiresAt })
    .where(eq(users.id, userId));
}

export async function validatePasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) return null;

  const user = await db.select().from(users).where(eq(users.resetToken, token)).limit(1);
  if (user.length === 0) return null;

  const resetUser = user[0];
  if (!resetUser.resetTokenExpires || new Date() > resetUser.resetTokenExpires) {
    await db.update(users)
      .set({ resetToken: null, resetTokenExpires: null })
      .where(eq(users.id, resetUser.id));
    return null;
  }

  return resetUser;
}

export async function clearPasswordResetToken(userId: number) {
  const db = await getDb();
  if (!db) return null;
  return await db.update(users)
    .set({ resetToken: null, resetTokenExpires: null })
    .where(eq(users.id, userId));
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) return null;
  return await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}
