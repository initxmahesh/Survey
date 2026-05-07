import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { ChevronDown, ChevronUp, Copy, FileText, Plus, Trash2 } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Nav } from "../components/Nav";
import { getSurvey, getSurveys, publishSurvey, updateSurvey } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import type { Question, QuestionType, Survey } from "../lib/types";

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

  const addOption = () => onChange({ ...q, options: [...(q.options ?? []), `Option ${(q.options?.length ?? 0) + 1}`] });
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
      <div className="flex gap-3">
        <div className="flex flex-col gap-1 pt-1">
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
                        condition: e.target.value
                          ? { questionId: e.target.value, operator: "equals", value: "" }
                          : null,
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

        <div className="flex gap-1">
          <Button size="icon" variant="ghost" title="Duplicate" onClick={(e) => e.stopPropagation()}>
            <Copy className="h-4 w-4 text-[var(--text-muted)]" />
          </Button>
          <Button
            size="icon"
            variant="danger"
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

export function BuilderPage() {
  const { id } = useParams();
  const [activeTop, setActiveTop] = useState<"builder" | "preview" | "analytics">("builder");
  const auth = useAuth();

  const [surveys, setSurveys] = useState<Array<Pick<Survey, "id" | "title" | "status">>>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState(() => id ?? "");
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<number | null>(null);

  const [survey, setSurvey] = useState<Survey | null>(null);

  const sidebarActive = useMemo(() => selectedSurveyId || id || "", [selectedSurveyId, id]);

  const loadSidebar = async () => {
    const res = await getSurveys();
    const rows = (res.data?.data ?? []) as any[];
    const slim = rows.map((r) => ({ id: r.id, title: r.title, status: r.status })) as Array<
      Pick<Survey, "id" | "title" | "status">
    >;
    setSurveys(slim);
    if (!selectedSurveyId && (id || slim[0]?.id)) setSelectedSurveyId(id || slim[0]!.id);
  };

  const loadSurvey = async (sid: string) => {
    const res = await getSurvey(sid);
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
    if (!auth.authed) {
      setLoading(false);
      setError("Login required to edit surveys.");
      return;
    }
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        await loadSidebar();
      } catch (e: any) {
        setError(e?.response?.data?.error ?? "Failed to load surveys");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.authed]);

  useEffect(() => {
    if (!auth.authed) return;
    if (!selectedSurveyId) return;
    setError(null);
    void loadSurvey(selectedSurveyId).catch((e: any) => setError(e?.response?.data?.error ?? "Failed to load survey"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSurveyId, auth.authed]);

  const queueSave = (next: Survey) => {
    setSurvey(next);
    setSaved(false);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        await updateSurvey(next.id, {
          title: next.title,
          description: next.description ?? "",
          schema: next.schema,
          status: next.status,
        });
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1200);
      } catch (e: any) {
        setError(e?.response?.data?.error ?? "Failed to save survey");
      }
    }, 500);
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
    queueSave({ ...survey, schema: [...survey.schema, newQ] });
    setActiveQuestionId(newQ.id);
  };

  const updateQuestion = (updated: Question) => {
    if (!survey) return;
    queueSave({ ...survey, schema: survey.schema.map((q) => (q.id === updated.id ? updated : q)) });
  };

  const deleteQuestion = (qid: string) => {
    if (!survey) return;
    queueSave({ ...survey, schema: survey.schema.filter((q) => q.id !== qid) });
  };

  const moveQuestion = (from: number, to: number) => {
    if (!survey) return;
    if (to < 0 || to >= survey.schema.length) return;
    const next = [...survey.schema];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);
    queueSave({ ...survey, schema: next });
  };

  const handleSave = () => {
    if (!survey) return;
    queueSave({ ...survey });
  };

  const isPublished = survey?.status !== "draft";

  return (
    <>
      <Nav
        active={activeTop}
        onChange={(next) => {
          setActiveTop(next);
          // This page is only the Builder UI; we keep the top nav visual parity with SurveyApp.jsx.
        }}
      />

      <div className="flex h-auto min-h-[calc(100vh-58px)] flex-col overflow-hidden md:h-[calc(100vh-58px)] md:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 border-b border-[var(--border)] bg-white p-4 md:w-[240px] md:border-b-0 md:border-r">
          <div className="mb-3 flex items-center justify-between px-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              Surveys
            </span>
            <Button size="icon" variant="primary" onClick={() => {}}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-1 overflow-auto md:flex-col">
            {surveys.map((sv) => (
              <button
                key={sv.id}
                type="button"
                onClick={() => {
                  setSelectedSurveyId(sv.id);
                  setActiveQuestionId(null);
                }}
                className={[
                  "flex min-w-[240px] items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13.5px] font-medium transition md:min-w-0 md:w-full",
                  sv.id === sidebarActive
                    ? "bg-accent-light text-accent"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]",
                ].join(" ")}
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{sv.title}</span>
                <Badge tone={sv.status === "active" ? "green" : sv.status === "closed" ? "red" : "gray"} className="text-[10px]">
                  {sv.status}
                </Badge>
              </button>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-auto bg-[var(--bg)] px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-7">
          <div className="mx-auto max-w-[720px]">
            {error && (
              <Card className="mb-4 border border-[#FCA5A5] bg-[var(--danger-light)] text-[var(--danger)]">{error}</Card>
            )}
            {loading ? (
              <Card className="py-10 text-center text-[13.5px] text-[var(--text-muted)]">Loading…</Card>
            ) : survey ? (
              <>
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <input
                      className="w-full bg-transparent font-serif text-[22px] font-semibold text-[var(--text-primary)] outline-none"
                      value={survey.title}
                      onChange={(e) => queueSave({ ...survey, title: e.target.value })}
                      placeholder="Survey title..."
                    />
                    <input
                      className="mt-1 w-full bg-transparent text-[14px] text-[var(--text-secondary)] outline-none"
                      value={survey.description ?? ""}
                      onChange={(e) => queueSave({ ...survey, description: e.target.value })}
                      placeholder="Add a description..."
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant={saved ? "secondary" : "primary"} onClick={handleSave}>
                      {saved ? "Saved" : "Save changes"}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        try {
                          setError(null);
                          if (isPublished) return;
                          await publishSurvey(survey.id);
                          await loadSidebar();
                          await loadSurvey(survey.id);
                        } catch (e: any) {
                          setError(e?.response?.data?.error ?? "Failed to publish survey");
                        }
                      }}
                      disabled={isPublished}
                    >
                      {isPublished ? "Published" : "Publish"}
                    </Button>
                  </div>
                </div>

                {saved && (
                  <Card className="mb-4 border border-[#A7F3D0] bg-[var(--success-light)] text-[var(--success)]">
                    Changes saved successfully
                  </Card>
                )}

                <div className="mb-5 flex flex-col gap-2.5">
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

                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-[12.5px] font-medium text-[var(--text-muted)]">Add question:</span>
                  {QUESTION_TYPES.map((t) => (
                    <Button key={t.value} size="sm" variant="secondary" onClick={() => addQuestion(t.value)}>
                      <Plus className="h-3.5 w-3.5" />
                      {t.label}
                    </Button>
                  ))}
                </div>
              </>
            ) : (
              <Card>Survey not found.</Card>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

