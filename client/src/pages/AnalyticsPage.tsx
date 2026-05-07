import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BarChart3, FileText, Star, Users } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import type { Question } from "../lib/types";
import { getAnalytics, getSurvey } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

function maxChoiceCount(counts: Record<string, number>) {
  return Math.max(...Object.values(counts), 1);
}

export function AnalyticsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [surveyTitle, setSurveyTitle] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.authed) {
      setLoading(false);
      setError("Login required to view analytics.");
      return;
    }
    if (!id) return;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const surveyRes = await getSurvey(id);
        const s = surveyRes.data?.data as any;
        setSurveyTitle(s.title);
        setQuestions((s.schema ?? []) as Question[]);

        const analyticsRes = await getAnalytics(id);
        setData(analyticsRes.data?.data);
      } catch (e: any) {
        setError(e?.response?.data?.error ?? "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, auth.authed]);

  const avgRatingQ = useMemo(() => questions.find((q) => q.type === "rating")?.id, [questions]);

  return (
    <div className="min-h-[100vh] bg-[var(--bg)] px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-[920px]">
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-[14px] w-[14px]" />
            Back to dashboard
          </Button>
        </div>
        {error && (
          <Card className="mb-4 border border-[#FCA5A5] bg-[var(--danger-light)] text-[var(--danger)]">{error}</Card>
        )}
        {loading ? (
          <Card className="py-10 text-center text-[13.5px] text-[var(--text-muted)]">Loading…</Card>
        ) : null}
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-[26px] text-[var(--text-primary)]">{surveyTitle || "Survey"}</h1>
            <p className="mt-1 text-[13.5px] text-[var(--text-secondary)]">Analytics & response insights</p>
          </div>
          <Button variant="secondary" size="sm">
            Export CSV
          </Button>
        </div>

        <div className="mb-7 grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total responses", value: data?.totalResponses ?? 0, icon: <Users className="h-[18px] w-[18px]" /> },
            { label: "Completion rate", value: `${data?.completionRate ?? 0}%`, icon: <BarChart3 className="h-[18px] w-[18px]" /> },
            {
              label: "Avg. rating",
              value: avgRatingQ ? "See below" : "–",
              icon: <Star className="h-[18px] w-[18px]" />,
            },
            { label: "Active since", value: "Jan 15", icon: <FileText className="h-[18px] w-[18px]" /> },
          ].map((s, i) => (
            <Card key={i} className="p-5">
              <div className="mb-2 text-accent">{s.icon}</div>
              <div className="font-serif text-[28px] font-semibold text-[var(--text-primary)]">{s.value}</div>
              <div className="mt-1 text-[12px] font-medium uppercase tracking-[0.04em] text-[var(--text-muted)]">
                {s.label}
              </div>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {questions.map((q: Question, idx: number) => {
            if (q.type === "single" || q.type === "multi") {
              const row = (data?.perQuestion ?? []).find((r: any) => r.questionId === q.id);
              const counts = (row?.choiceCounts ?? {}) as Record<string, number>;
              const max = maxChoiceCount(counts);
              const total = Object.values(counts).reduce((a, b) => a + b, 0);

              return (
                <Card key={q.id}>
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <Badge tone="gray">
                        Q{idx + 1} · {q.type === "single" ? "Single choice" : "Multi-select"}
                      </Badge>
                      <div className="mt-2 text-[15px] font-medium text-[var(--text-primary)]">{q.label}</div>
                    </div>
                    <div className="text-[13px] font-medium text-[var(--text-muted)]">{total} answers</div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {Object.entries(counts).map(([opt, count]) => (
                      <div key={opt} className="flex items-center gap-2.5">
                        <div className="w-[140px] truncate text-[13px] text-[var(--text-secondary)]">{opt}</div>
                        <div className="relative flex-1">
                          <div
                            className="h-7 min-w-[2px] rounded bg-accent-light"
                            style={{ width: `${(count / max) * 100}%`, borderRight: "3px solid var(--accent)" }}
                          />
                        </div>
                        <div className="w-10 text-right text-[13px] font-semibold text-[var(--text-primary)]">{count}</div>
                        <div className="w-10 text-right text-[11.5px] text-[var(--text-muted)]">
                          {total > 0 ? Math.round((count / total) * 100) : 0}%
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            }

            if (q.type === "rating") {
              const row = (data?.perQuestion ?? []).find((r: any) => r.questionId === q.id);
              const avg = row?.average ?? "–";
              const distObj = (row?.distribution ?? {}) as Record<number, number>;
              const dist = [1, 2, 3, 4, 5].map((n) => distObj[n] ?? 0);
              const maxDist = Math.max(...dist, 1);

              return (
                <Card key={q.id}>
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <Badge tone="gray">Q{idx + 1} · Rating</Badge>
                      <div className="mt-2 text-[15px] font-medium text-[var(--text-primary)]">{q.label}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-serif text-[24px] font-semibold text-accent">{avg}</div>
                      <div className="text-[11px] font-medium text-[var(--text-muted)]">avg. score</div>
                    </div>
                  </div>

                  <div className="flex h-[60px] items-end gap-2">
                    {dist.map((count, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <div className="text-[11px] font-semibold text-accent">{count}</div>
                        <div
                          className="w-full rounded bg-accent-light"
                          style={{
                            height: `${(count / maxDist) * 40}px`,
                            minHeight: 4,
                            borderTop: "2px solid var(--accent)",
                            transition: "height 500ms ease",
                          }}
                        />
                        <div className="text-[11px] text-[var(--text-muted)]">{i + 1}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-1 flex justify-between text-[10.5px] text-[var(--text-muted)]">
                    <span>Not satisfied</span>
                    <span>Very satisfied</span>
                  </div>
                </Card>
              );
            }

            if (q.type === "text") {
              const row = (data?.perQuestion ?? []).find((r: any) => r.questionId === q.id);
              const texts = (row?.textResponses ?? []) as string[];
              return (
                <Card key={q.id}>
                  <div className="mb-4">
                    <Badge tone="gray">Q{idx + 1} · Text</Badge>
                    <div className="mt-2 text-[15px] font-medium text-[var(--text-primary)]">{q.label}</div>
                  </div>
                  {texts.length === 0 ? (
                    <div className="text-[13px] text-[var(--text-muted)]">No text responses yet</div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {texts.map((t, i) => (
                        <div
                          key={i}
                          className="rounded-md bg-[var(--surface)] px-4 py-2.5 text-[13.5px] leading-6 text-[var(--text-secondary)]"
                        >
                          “{t}”
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
}

