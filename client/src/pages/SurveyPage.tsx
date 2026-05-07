import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { getSurveyBySlug, submitResponse } from "../lib/api";
import type { Answers, Question, Survey } from "../lib/types";

function getVisibleQuestions(questions: Question[], answers: Answers): Question[] {
  return questions.filter((q) => {
    if (!q.condition) return true;
    const { questionId, operator, value } = q.condition;
    const answer = answers[questionId];
    if (operator === "equals") return answer === value;
    if (operator === "not_equals") return answer !== value;
    return true;
  });
}

export function SurveyPage() {
  const { slug } = useParams();
  const [survey, setSurvey] = useState<Pick<Survey, "id" | "title" | "description" | "schema"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setLoadError(null);
    void (async () => {
      try {
        const res = await getSurveyBySlug(slug);
        const s = res.data?.data as any;
        setSurvey({
          id: s.id,
          title: s.title,
          description: s.description ?? "",
          schema: (s.schema ?? []) as Question[],
        });
      } catch (e: any) {
        setLoadError(e?.response?.data?.error ?? "Survey not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const visibleQuestions = useMemo(
    () => getVisibleQuestions(survey?.schema ?? [], answers),
    [survey?.schema, answers],
  );
  const totalSteps = visibleQuestions.length;
  const currentQ = visibleQuestions[currentStep];
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  const setAnswer = (qId: string, value: Answers[string]) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
    setErrors((prev) => ({ ...prev, [qId]: null }));
  };

  const validate = () => {
    if (!currentQ) return true;
    if (currentQ.required) {
      const a = answers[currentQ.id];
      if (!a || (Array.isArray(a) && a.length === 0) || a === "") {
        setErrors((prev) => ({ ...prev, [currentQ.id]: "This field is required" }));
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validate()) return;
    if (currentStep < totalSteps - 1) setCurrentStep((s) => s + 1);
    else void handleSubmit();
  };

  const handleSubmit = async () => {
    if (!survey) return;
    try {
      await submitResponse(survey.id, { answers, isPartial: false });
      setSubmitted(true);
    } catch {
      setErrors((prev) => ({ ...prev, _submit: "Failed to submit. Please try again." }));
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-[100vh] items-center justify-center bg-[var(--bg)] p-6">
        <div className="max-w-[420px] text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success-light)] text-[var(--success)]">
            <Check className="h-7 w-7" />
          </div>
          <h2 className="font-serif text-[26px] text-[var(--text-primary)]">Thank you!</h2>
          <p className="mt-2 text-[15px] leading-6 text-[var(--text-secondary)]">
            Your response has been recorded. We really appreciate you taking the time to share your feedback.
          </p>
          <div className="mt-6 flex justify-center">
            <Button
              variant="secondary"
              onClick={() => {
                setSubmitted(false);
                setAnswers({});
                setCurrentStep(0);
              }}
            >
              Submit another response
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[100vh] bg-[var(--bg)] px-6 py-10">
        <div className="mx-auto max-w-[640px]">
          <Card className="py-10 text-center text-[13.5px] text-[var(--text-muted)]">Loading…</Card>
        </div>
      </div>
    );
  }

  if (loadError || !survey) {
    return (
      <div className="min-h-[100vh] bg-[var(--bg)] px-6 py-10">
        <div className="mx-auto max-w-[640px]">
          <Card className="p-7">
            <div className="font-serif text-[22px] font-semibold text-[var(--text-primary)]">You can’t view this form</div>
            <div className="mt-2 text-[14px] leading-6 text-[var(--text-secondary)]">
              This survey link is unavailable. It may be unpublished/inactive, or the link may be incorrect. Try contacting the admin.
            </div>
            <div className="mt-4 rounded-md border border-[#FCA5A5] bg-[var(--danger-light)] px-4 py-2.5 text-[13.5px] text-[var(--danger)]">
              {loadError ?? "Survey not found"}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => window.location.reload()}>
                Try again
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100vh] bg-[var(--bg)] px-6 py-10">
      <div className="mx-auto max-w-[640px]">
        <div className="mb-7">
          <h1 className="font-serif text-[28px] text-[var(--text-primary)]">{survey.title}</h1>
          <p className="mt-1 text-[14.5px] text-[var(--text-secondary)]">{survey.description}</p>
        </div>

        <div className="mb-7">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-[var(--text-muted)]">
              Question {Math.min(currentStep + 1, totalSteps)} of {totalSteps}
            </span>
            <span className="text-[12.5px] font-semibold text-accent">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface)]">
            <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {currentQ && (
          <Card className="p-7">
            <div className="mb-5">
              <div className="text-[16px] font-medium leading-6 text-[var(--text-primary)]">
                {currentQ.label || "Untitled question"}
                {currentQ.required && <span className="ml-1 text-[var(--danger)]">*</span>}
              </div>
              {currentQ.condition && (
                <div className="mt-2">
                  <Badge tone="warning">Shown based on previous answer</Badge>
                </div>
              )}
            </div>

            {currentQ.type === "text" && (
              <textarea
                className="min-h-[90px] w-full resize-y rounded-md border border-[var(--border)] bg-white px-3 py-2.5 text-[14px] leading-6 text-[var(--text-primary)] outline-none transition hover:border-[var(--border-hover)] focus:border-accent focus:ring-4 focus:ring-accent/10"
                placeholder="Your answer..."
                value={(answers[currentQ.id] as string | undefined) ?? ""}
                onChange={(e) => setAnswer(currentQ.id, e.target.value)}
              />
            )}

            {currentQ.type === "rating" && (
              <div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={[
                        "flex h-10 w-10 items-center justify-center rounded-md border text-[15px] font-semibold transition",
                        answers[currentQ.id] === n
                          ? "border-accent bg-accent text-white"
                          : "border-[var(--border)] bg-white text-[var(--text-secondary)] hover:border-accent hover:bg-accent-light hover:text-accent",
                      ].join(" ")}
                      onClick={() => setAnswer(currentQ.id, n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-[var(--text-muted)]">
                  <span>Not satisfied</span>
                  <span>Very satisfied</span>
                </div>
              </div>
            )}

            {currentQ.type === "single" && (
              <div className="flex flex-col gap-2">
                {(currentQ.options ?? []).map((opt) => {
                  const selected = answers[currentQ.id] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      className={[
                        "flex items-center gap-3 rounded-md border px-4 py-2.5 text-left transition",
                        selected ? "border-accent bg-accent-light" : "border-[var(--border)] bg-white hover:border-[var(--border-hover)]",
                      ].join(" ")}
                      onClick={() => setAnswer(currentQ.id, opt)}
                    >
                      <span
                        className={[
                          "flex h-4 w-4 items-center justify-center rounded-full border-2 transition",
                          selected ? "border-accent bg-accent" : "border-[var(--border)]",
                        ].join(" ")}
                      >
                        {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                      <span className="text-[14px] text-[var(--text-primary)]">{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQ.type === "multi" && (
              <div className="flex flex-col gap-2">
                {(currentQ.options ?? []).map((opt) => {
                  const cur = (answers[currentQ.id] as string[] | undefined) ?? [];
                  const selected = cur.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      className={[
                        "flex items-center gap-3 rounded-md border px-4 py-2.5 text-left transition",
                        selected ? "border-accent bg-accent-light" : "border-[var(--border)] bg-white hover:border-[var(--border-hover)]",
                      ].join(" ")}
                      onClick={() => setAnswer(currentQ.id, selected ? cur.filter((v) => v !== opt) : [...cur, opt])}
                    >
                      <span
                        className={[
                          "flex h-4 w-4 items-center justify-center rounded border-2 transition",
                          selected ? "border-accent bg-accent" : "border-[var(--border)]",
                        ].join(" ")}
                      >
                        {selected && <Check className="h-3 w-3 text-white" />}
                      </span>
                      <span className="text-[14px] text-[var(--text-primary)]">{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {errors[currentQ.id] && (
              <div className="mt-4 rounded-md border border-[#FCA5A5] bg-[var(--danger-light)] px-4 py-2.5 text-[13.5px] text-[var(--danger)]">
                {errors[currentQ.id]}
              </div>
            )}
            {errors._submit && (
              <div className="mt-4 rounded-md border border-[#FCA5A5] bg-[var(--danger-light)] px-4 py-2.5 text-[13.5px] text-[var(--danger)]">
                {errors._submit}
              </div>
            )}
          </Card>
        )}

        <div className="mt-5 flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={currentStep === 0}
          >
            ← Back
          </Button>
          <Button variant="primary" size="lg" onClick={handleNext}>
            {currentStep === totalSteps - 1 ? (
              <>
                <Check className="h-4 w-4" /> Submit
              </>
            ) : (
              <>
                Next <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

