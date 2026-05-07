import type { Config } from "drizzle-kit";
import dotenv from "dotenv";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

dotenv.config();

// drizzle-kit uses @neondatabase/serverless under the hood; in Node it needs a WS implementation.
neonConfig.webSocketConstructor = ws;

export default {
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config;

