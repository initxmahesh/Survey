import express from "express";
import cors from "cors";
import helmet from "helmet";
import { apiLimiter } from "./middleware/rateLimiter";

import authRoutes from "./routes/auth";
import surveyRoutes from "./routes/surveys";
import responseRoutes from "./routes/responses";
import analyticsRoutes from "./routes/analytics";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.use("/api", apiLimiter);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/surveys", surveyRoutes);
  app.use("/api/surveys/:surveyId/responses", responseRoutes);
  app.use("/api/surveys/:surveyId/analytics", analyticsRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
  });

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

