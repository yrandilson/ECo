import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerLocalAuthRoutes } from "../auth-local";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { logger } from "../logger";
import { getDb } from "../db/connection";
import { initWebSocket } from "../websocket";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Inicializar WebSocket para dados em tempo real
  initWebSocket(server);

  // Parse cookies from incoming requests
  app.use(cookieParser());
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Local authentication routes (login/register)
  registerLocalAuthRoutes(app);
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // ── Health Check ───────────────────────────────────────────
  app.get("/api/health", async (_req, res) => {
    const status: Record<string, unknown> = {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
    try {
      const db = await getDb();
      if (db) {
        await db.execute("SELECT 1");
        status.database = "connected";
      } else {
        status.database = "unavailable";
        status.status = "degraded";
      }
    } catch (err) {
      status.database = "error";
      status.status = "degraded";
    }
    const httpCode = status.status === "ok" ? 200 : 503;
    res.status(httpCode).json(status);
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    logger.warn(`Port ${preferredPort} is busy, using port ${port} instead`, { preferredPort, port });
  }

  server.listen(port, () => {
    logger.info(`Server running on http://localhost:${port}/`, { port });
  });
}

startServer().catch((err) => {
  logger.error("Failed to start server", { error: String(err) });
  process.exit(1);
});
