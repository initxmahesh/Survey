import type { VercelRequest, VercelResponse } from "@vercel/node";
import dotenv from "dotenv";
import { createApp } from "../server/src/app";

dotenv.config();

const app = createApp();

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}

