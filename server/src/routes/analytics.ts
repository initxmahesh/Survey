import { Router, type Request, type Response } from "express";
import { db } from "../db";
import { surveys, responses } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router({ mergeParams: true });

router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const surveyId = String((req.params as any).surveyId);

    const survey = await db.query.surveys.findFirst({ where: eq(surveys.id, surveyId) });
    if (!survey) {
      res.status(404).json({ error: "Survey not found" });
      return;
    }

    const allResponses = await db.select().from(responses).where(eq(responses.surveyId, surveyId));

    const completedResponses = allResponses.filter((r) => !r.isPartial);
    const totalResponses = completedResponses.length;
    const completionRate =
      allResponses.length > 0 ? Math.round((completedResponses.length / allResponses.length) * 100) : 0;

    const questions = ((survey.schema as any[]) || []) as any[];

    const perQuestion = questions.map((q: any) => {
      const questionAnswers = completedResponses
        .map((r) => (r.answers as Record<string, any>)[q.id])
        .filter((a) => a !== undefined && a !== null && a !== "");

      if (q.type === "single" || q.type === "multi") {
        const choiceCounts: Record<string, number> = {};
        (q.options || []).forEach((opt: string) => (choiceCounts[opt] = 0));
        questionAnswers.forEach((answer: any) => {
          const values = Array.isArray(answer) ? answer : [answer];
          values.forEach((v: string) => {
            if (choiceCounts[v] !== undefined) choiceCounts[v]++;
            else choiceCounts[v] = 1;
          });
        });
        return {
          questionId: q.id,
          questionLabel: q.label,
          type: q.type,
          responseCount: questionAnswers.length,
          choiceCounts,
        };
      }

      if (q.type === "rating") {
        const nums = questionAnswers.filter((a: any) => typeof a === "number") as number[];
        const average =
          nums.length > 0 ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : 0;
        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        nums.forEach((n) => {
          if (distribution[n] !== undefined) distribution[n]++;
        });
        return {
          questionId: q.id,
          questionLabel: q.label,
          type: q.type,
          responseCount: nums.length,
          average,
          distribution,
        };
      }

      if (q.type === "text") {
        return {
          questionId: q.id,
          questionLabel: q.label,
          type: q.type,
          responseCount: questionAnswers.length,
          textResponses: (questionAnswers as string[]).slice(0, 100),
        };
      }

      return { questionId: q.id, questionLabel: q.label, type: q.type, responseCount: 0 };
    });

    res.json({
      data: {
        surveyId,
        surveyTitle: survey.title,
        totalResponses,
        completionRate,
        perQuestion,
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to compute analytics" });
  }
});

export default router;

