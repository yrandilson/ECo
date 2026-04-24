import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { COOKIE_NAME } from "@shared/const";
import { validateLocalAuth } from "../auth-local";
import { getUserById } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const token = opts.req.cookies?.[COOKIE_NAME];
    if (token) {
      const decoded = validateLocalAuth(token);
      if (decoded) {
        const localUser = await getUserById(decoded.userId);
        if (localUser) {
          user = localUser;
        }
      }
    }
    if (!user && token) {
      try {
        user = await sdk.authenticateRequest(opts.req);
      } catch {
        user = null;
      }
    }
  } catch (err) {
    console.error('[Context] Auth error:', err);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
