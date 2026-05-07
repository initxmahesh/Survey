import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { db } from "../db";
import { surveys, responses } from "../db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import slugify from "slugify";
import { v4 as uuidv4 } from "uuid";

const router = Router();

const SurveySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  schema: z.array(z.any()).optional().default([]),
  status: z.enum(["draft", "active", "closed"]).optional().default("draft"),
});

const makeSlug = (title: string) => slugify(title, { lower: true, strict: true }) + "-" + uuidv4().slice(0, 6);

router.get("/", requireAuth, async (_req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        id: surveys.id,
        title: surveys.title,
        description: surveys.description,
        slug: surveys.slug,
        status: surveys.status,
        version: surveys.version,
        createdAt: surveys.createdAt,
        updatedAt: surveys.updatedAt,
        responseCount: sql<number>`(
          SELECT COUNT(*) FROM responses
          WHERE responses.survey_id = ${surveys.id}
          AND responses.is_partial = false
        )`.mapWith(Number),
      })
      .from(surveys)
      .orderBy(desc(surveys.createdAt));
    res.json({ data: rows });
  } catch {
    res.status(500).json({ error: "Failed to fetch surveys" });
  }
});

router.post("/", requireAuth, validate(SurveySchema), async (req: Request, res: Response) => {
  try {
    const { title, description, schema, status } = req.body as z.infer<typeof SurveySchema>;
    const slug = makeSlug(title);
    const [survey] = await db.insert(surveys).values({ title, description, slug, schema, status }).returning();
    res.status(201).json({ data: survey });
  } catch {
    res.status(500).json({ error: "Failed to create survey" });
  }
});

router.get("/slug/:slug", async (req: Request, res: Response) => {
  try {
    const survey = await db.query.surveys.findFirst({
      where: eq(surveys.slug, String((req.params as any).slug)),
    });
    if (!survey) {
      res.status(404).json({ error: "Survey not found" });
      return;
    }
    if (survey.status === "draft") {
      res.status(404).json({ error: "Survey is not published" });
      return;
    }
    if (survey.status === "closed") {
      res.status(404).json({ error: "Survey is inactive" });
      return;
    }
    if (survey.status !== "active") {
      res.status(404).json({ error: "Survey not available" });
      return;
    }
    res.json({
      data: {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        slug: survey.slug,
        schema: survey.schema,
        version: survey.version,
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch survey" });
  }
});

router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const survey = await db.query.surveys.findFirst({
      where: eq(surveys.id, String((req.params as any).id)),
    });
    if (!survey) {
      res.status(404).json({ error: "Survey not found" });
      return;
    }
    res.json({ data: survey });
  } catch {
    res.status(500).json({ error: "Failed to fetch survey" });
  }
});

router.put("/:id", requireAuth, validate(SurveySchema), async (req: Request, res: Response) => {
  try {
    const [updated] = await db
      .update(surveys)
      .set({ ...(req.body as z.infer<typeof SurveySchema>), updatedAt: new Date() })
      .where(eq(surveys.id, String((req.params as any).id)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Survey not found" });
      return;
    }
    res.json({ data: updated });
  } catch {
    res.status(500).json({ error: "Failed to update survey" });
  }
});

router.patch("/:id/publish", requireAuth, async (req: Request, res: Response) => {
  try {
    const [updated] = await db
      .update(surveys)
      .set({ status: "active", updatedAt: new Date() })
      .where(eq(surveys.id, String((req.params as any).id)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Survey not found" });
      return;
    }
    res.json({ data: updated });
  } catch {
    res.status(500).json({ error: "Failed to publish survey" });
  }
});

router.patch("/:id/unpublish", requireAuth, async (req: Request, res: Response) => {
  try {
    const [updated] = await db
      .update(surveys)
      .set({ status: "draft", updatedAt: new Date() })
      .where(eq(surveys.id, String((req.params as any).id)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Survey not found" });
      return;
    }
    res.json({ data: updated });
  } catch {
    res.status(500).json({ error: "Failed to unpublish survey" });
  }
});

router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const [deleted] = await db
      .delete(surveys)
      .where(eq(surveys.id, String((req.params as any).id)))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Survey not found" });
      return;
    }
    res.json({ message: "Survey deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete survey" });
  }
});

export default router;

