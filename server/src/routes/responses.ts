import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { db } from "../db";
import { responses, surveys } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { submitLimiter } from "../middleware/rateLimiter";

const router = Router({ mergeParams: true });

const ResponseSchema = z.object({
  answers: z.record(z.string(), z.any()),
  respondentId: z.string().optional(),
  isPartial: z.boolean().optional().default(false),
});

router.post("/", submitLimiter, validate(ResponseSchema), async (req: Request, res: Response) => {
  try {
    const surveyId = String((req.params as any).surveyId);
    const survey = await db.query.surveys.findFirst({ where: eq(surveys.id, surveyId) });
    if (!survey || survey.status !== "active") {
      res.status(404).json({ error: "Survey not available" });
      return;
    }
    const body = req.body as z.infer<typeof ResponseSchema>;
    const [response] = await db
      .insert(responses)
      .values({
        surveyId,
        surveyVersion: survey.version,
        answers: body.answers,
        respondentId: body.respondentId,
        isPartial: body.isPartial,
        metadata: { userAgent: req.get("user-agent")?.slice(0, 100) },
      })
      .returning();
    res.status(201).json({ data: response });
  } catch {
    res.status(500).json({ error: "Failed to submit response" });
  }
});

router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const surveyId = String((req.params as any).surveyId);
    const rows = await db
      .select()
      .from(responses)
      .where(eq(responses.surveyId, surveyId))
      .orderBy(desc(responses.submittedAt));
    res.json({ data: rows });
  } catch {
    res.status(500).json({ error: "Failed to fetch responses" });
  }
});

export default router;

