import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Copy, FileText, Plus, Trash2 } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { getSurvey, publishSurvey, updateSurvey } from "../../lib/api";
import type { Question, QuestionType, Survey } from "../../lib/types";

const QUESTION_TYPES: Array<{ value: QuestionType; label: string }> = [
  { value: "text", label: "Text Input" },
  { value: "single", label: "Single Choice" },
  { value: "multi", label: "Multi-select" },
  { value: "rating", label: "Rating (1–5)" },
];

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function QuestionCard({
  q,
  idx,
  total,
  allQuestions,
  isActive,
  onActivate,
  onChange,
  onDelete,
  onMove,
}: {
  q: Question;
  idx: number;
  total: number;
  allQuestions: Question[];
  isActive: boolean;
  onActivate: () => void;
  onChange: (q: Question) => void;
  onDelete: () => void;
  onMove: (from: number, to: number) => void;
}) {
  const canHaveOptions = q.type === "single" || q.type === "multi";
  const otherSingle = allQuestions.filter((aq) => aq.id !== q.id && aq.type === "single");

  const addOption = () =>
    onChange({ ...q, options: [...(q.options ?? []), `Option ${(q.options?.length ?? 0) + 1}`] });
  const removeOption = (i: number) => onChange({ ...q, options: (q.options ?? []).filter((_, oi) => oi !== i) });
  const updateOption = (i: number, v: string) =>
    onChange({ ...q, options: (q.options ?? []).map((o, oi) => (oi === i ? v : o)) });

  return (
    <div
      className={[
        "rounded-2xl border bg-white px-5 py-4 transition",
        isActive
          ? "border-accent shadow-[0_0_0_3px_rgba(37,99,235,0.08)]"
          : "border-[var(--border)] hover:border-[var(--border-hover)] hover:shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
      ].join(" ")}
      onClick={onActivate}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start gap-3">
        <div className="flex shrink-0 flex-col gap-1 pt-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onMove(idx, idx - 1);
            }}
            disabled={idx === 0}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onMove(idx, idx + 1);
            }}
            disabled={idx === total - 1}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="gray">Q{idx + 1}</Badge>
            <Badge tone="blue">{QUESTION_TYPES.find((t) => t.value === q.type)?.label}</Badge>
            {q.required && <Badge tone="red">Required</Badge>}
            {q.condition && <Badge tone="warning">Conditional</Badge>}
          </div>

          <div className="mb-2">
            <label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">Question text</label>
            <input
              className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2.5 text-[14px] text-[var(--text-primary)] outline-none transition hover:border-[var(--border-hover)] focus:border-accent focus:ring-4 focus:ring-accent/10"
              value={q.label}
              onChange={(e) => onChange({ ...q, label: e.target.value })}
              placeholder="Enter your question..."
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {isActive && (
            <div className="mt-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
                    Question type
                  </label>
                  <select
                    className="w-full cursor-pointer rounded-md border border-[var(--border)] bg-white px-3 py-2.5 text-[14px] text-[var(--text-primary)] outline-none transition hover:border-[var(--border-hover)] focus:border-accent focus:ring-4 focus:ring-accent/10"
                    value={q.type}
                    onChange={(e) => {
                      const next = e.target.value as QuestionType;
                      onChange({
                        ...q,
                        type: next,
                        options:
                          next === "single" || next === "multi"
                            ? q.options?.length
                              ? q.options
                              : ["Option 1", "Option 2"]
                            : [],
                      });
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {QUESTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex cursor-pointer items-center gap-2 select-none">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) => onChange({ ...q, required: e.target.checked })}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-[13.5px] font-medium text-[var(--text-secondary)]">Required</span>
                  </label>
                </div>
              </div>

              {canHaveOptions && (
                <div className="mt-3">
                  <label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
                    Answer options
                  </label>
                  <div className="flex flex-col gap-2">
                    {(q.options ?? []).map((opt, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2.5 text-[14px] text-[var(--text-primary)] outline-none transition hover:border-[var(--border-hover)] focus:border-accent focus:ring-4 focus:ring-accent/10"
                          value={opt}
                          onChange={(e) => updateOption(i, e.target.value)}
                          placeholder={`Option ${i + 1}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeOption(i);
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="self-start text-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        addOption();
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add option
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-3">
                <label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
                  Conditional logic <span className="font-normal text-[var(--text-muted)]">(optional)</span>
                </label>
                <div className="flex flex-col gap-2 md:flex-row">
                  <select
                    className="w-full cursor-pointer rounded-md border border-[var(--border)] bg-white px-3 py-2.5 text-[14px] text-[var(--text-primary)] outline-none transition hover:border-[var(--border-hover)] focus:border-accent focus:ring-4 focus:ring-accent/10"
                    value={q.condition?.questionId ?? ""}
                    onChange={(e) =>
                      onChange({
                        ...q,
                        condition: e.target.value ? { questionId: e.target.value, operator: "equals", value: "" } : null,
                      })
                    }
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="">No condition</option>
                    {otherSingle.map((oq) => (
                      <option key={oq.id} value={oq.id}>
                        If: {oq.label.slice(0, 30) || "Untitled"}...
                      </option>
                    ))}
                  </select>
                  {q.condition?.questionId && (
                    <select
                      className="w-full cursor-pointer rounded-md border border-[var(--border)] bg-white px-3 py-2.5 text-[14px] text-[var(--text-primary)] outline-none transition hover:border-[var(--border-hover)] focus:border-accent focus:ring-4 focus:ring-accent/10"
                      value={q.condition.value}
                      onChange={(e) => onChange({ ...q, condition: { ...q.condition!, value: e.target.value } })}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">= (select value)</option>
                      {(otherSingle.find((oq) => oq.id === q.condition?.questionId)?.options ?? []).map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-start gap-1 pt-1">
          <Button size="icon" variant="ghost" title="Duplicate" onClick={(e) => e.stopPropagation()}>
            <Copy className="h-4 w-4 text-[var(--text-muted)]" />
          </Button>
          <Button
            size="icon"
            variant="danger"
            className="shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SurveyInlineEditor({
  surveyId,
  onClose,
  onUpdated,
}: {
  surveyId: string;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [dirty, setDirty] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [publishedFlash, setPublishedFlash] = useState(false);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!linkCopied) return;
    const t = window.setTimeout(() => setLinkCopied(false), 1500);
    return () => window.clearTimeout(t);
  }, [linkCopied]);

  useEffect(() => {
    if (!publishedFlash) return;
    const t = window.setTimeout(() => setPublishedFlash(false), 1500);
    return () => window.clearTimeout(t);
  }, [publishedFlash]);

  const loadSurvey = async () => {
    const res = await getSurvey(surveyId);
    const s = res.data?.data as any;
    setSurvey({
      id: s.id,
      title: s.title,
      description: s.description ?? "",
      slug: s.slug,
      status: s.status,
      schema: (s.schema ?? []) as Question[],
      version: s.version ?? 1,
      createdAt: new Date(s.createdAt).toISOString(),
      updatedAt: new Date(s.updatedAt).toISOString(),
      responses: 0,
    });
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    setLinkCopied(false);
    setPublishedFlash(false);
    void (async () => {
      try {
        await loadSurvey();
        setDirty(false);
        setSaved(false);
      } catch (e: any) {
        setError(e?.response?.data?.error ?? "Failed to load survey");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyId]);

  const applyLocal = (next: Survey) => {
    setSurvey(next);
    setDirty(true);
    setSaved(false);
  };

  const isPublished = survey?.status === "active";

  const saveNow = async () => {
    if (!survey) return;
    if (savingRef.current) return;
    savingRef.current = true;
    setError(null);
    try {
      await updateSurvey(survey.id, {
        title: survey.title,
        description: survey.description ?? "",
        schema: survey.schema,
        status: survey.status,
      });
      setDirty(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1200);
      onUpdated?.();
      await loadSurvey(); // keep UI in sync (updatedAt/version/etc)
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to save survey");
    } finally {
      savingRef.current = false;
    }
  };

  const addQuestion = (type: QuestionType) => {
    if (!survey) return;
    const newQ: Question = {
      id: genId(),
      type,
      label: "",
      required: false,
      options: type === "single" || type === "multi" ? ["Option 1", "Option 2"] : [],
      condition: null,
    };
    applyLocal({ ...survey, schema: [...survey.schema, newQ] });
    setActiveQuestionId(newQ.id);
  };

  const updateQuestion = (updated: Question) => {
    if (!survey) return;
    applyLocal({ ...survey, schema: survey.schema.map((q) => (q.id === updated.id ? updated : q)) });
  };

  const deleteQuestion = (qid: string) => {
    if (!survey) return;
    applyLocal({ ...survey, schema: survey.schema.filter((q) => q.id !== qid) });
  };

  const moveQuestion = (from: number, to: number) => {
    if (!survey) return;
    if (to < 0 || to >= survey.schema.length) return;
    const next = [...survey.schema];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);
    applyLocal({ ...survey, schema: next });
  };

  const shareUrl = useMemo(() => (survey ? `${location.origin}/s/${survey.slug}` : ""), [survey]);

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/35 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[980px] overflow-hidden rounded-3xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.10),0_4px_12px_rgba(0,0,0,0.06)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-h-[calc(100vh-48px)] overflow-auto p-6 sm:p-7">
          {error && (
            <Card className="mb-4 border border-[#FCA5A5] bg-[var(--danger-light)] text-[var(--danger)]">
              {error}
            </Card>
          )}

          {loading ? (
            <Card className="py-10 text-center text-[13.5px] text-[var(--text-muted)]">Loading editor…</Card>
          ) : survey ? (
            <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <input
                className="w-full bg-transparent font-serif text-[22px] font-semibold text-[var(--text-primary)] outline-none"
                value={survey.title}
                onChange={(e) => applyLocal({ ...survey, title: e.target.value })}
                placeholder="Survey title..."
              />
              <input
                className="mt-1 w-full bg-transparent text-[14px] text-[var(--text-secondary)] outline-none"
                value={survey.description ?? ""}
                onChange={(e) => applyLocal({ ...survey, description: e.target.value })}
                placeholder="Add a description..."
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone={survey.status === "active" ? "green" : survey.status === "closed" ? "red" : "gray"}>
                  {survey.status}
                </Badge>
                <span className="text-[12.5px] font-medium text-[var(--text-muted)]">
                  Public link: {isPublished ? "available" : "publish to enable"}
                </span>
                {dirty && (
                  <span className="text-[12.5px] font-medium text-[var(--text-muted)]">• Unsaved changes</span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Button
                size="sm"
                variant={linkCopied ? "primary" : "secondary"}
                onClick={async () => {
                  if (!shareUrl) return;
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    setLinkCopied(true);
                  } catch {
                    // ignore
                  }
                }}
                disabled={!survey.slug || !isPublished}
              >
                <Copy className="h-4 w-4" /> {linkCopied ? "Link copied" : "Copy link"}
              </Button>
              <Button
                size="sm"
                variant={publishedFlash ? "primary" : "secondary"}
                onClick={async () => {
                  try {
                    setError(null);
                    if (dirty) await saveNow();
                    if (isPublished) {
                      // Unpublish via existing update route (avoids needing a dedicated endpoint)
                      await updateSurvey(survey.id, {
                        title: survey.title,
                        description: survey.description ?? "",
                        schema: survey.schema,
                        status: "closed",
                      });
                      setPublishedFlash(false);
                      await loadSurvey();
                      onUpdated?.();
                    } else {
                      await publishSurvey(survey.id);
                      setPublishedFlash(true);
                      await loadSurvey();
                      onUpdated?.();
                    }
                  } catch (e: any) {
                    setError(e?.response?.data?.error ?? (isPublished ? "Failed to unpublish survey" : "Failed to publish survey"));
                  }
                }}
              >
                {isPublished ? "Unpublish" : "Publish"}
              </Button>
              <Button size="sm" variant={saved ? "secondary" : "primary"} onClick={saveNow} disabled={!dirty}>
                {saved ? "Saved" : "Save"}
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose}>
                Close editor
              </Button>
            </div>
          </div>

          {saved && (
            <Card className="mt-4 border border-[#A7F3D0] bg-[var(--success-light)] text-[var(--success)]">
              Changes saved successfully
            </Card>
          )}

          <div className="mt-5 flex flex-col gap-2.5">
            {survey.schema.length === 0 ? (
              <Card className="py-12 text-center">
                <FileText className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)] opacity-60" />
                <div className="text-[15px] font-medium text-[var(--text-secondary)]">No questions yet</div>
                <div className="mt-1 text-[13px] text-[var(--text-muted)]">
                  Add your first question using the buttons below
                </div>
              </Card>
            ) : (
              survey.schema.map((q, idx) => (
                <QuestionCard
                  key={q.id}
                  q={q}
                  idx={idx}
                  total={survey.schema.length}
                  allQuestions={survey.schema}
                  isActive={activeQuestionId === q.id}
                  onActivate={() => setActiveQuestionId(q.id)}
                  onChange={updateQuestion}
                  onDelete={() => deleteQuestion(q.id)}
                  onMove={moveQuestion}
                />
              ))
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[12.5px] font-medium text-[var(--text-muted)]">Add question:</span>
            {QUESTION_TYPES.map((t) => (
              <Button key={t.value} size="sm" variant="secondary" onClick={() => addQuestion(t.value)}>
                <Plus className="h-3.5 w-3.5" />
                {t.label}
              </Button>
            ))}
          </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

