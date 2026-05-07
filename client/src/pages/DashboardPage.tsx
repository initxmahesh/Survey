import { useEffect, useMemo, useState } from "react";
import { Copy, FileText, LineChart, Plus, Trash2, LogIn, LogOut } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { createSurvey, deleteSurvey, getSurveys } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import type { Survey } from "../lib/types";
import { SurveyInlineEditor } from "../components/builder/SurveyInlineEditor";

type NewSurveyDraft = { title: string; description: string };

export function DashboardPage() {
  const auth = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [draft, setDraft] = useState<NewSurveyDraft>({ title: "", description: "" });
  const [authModal, setAuthModal] = useState<null | "login" | "register">(null);
  const [authDraft, setAuthDraft] = useState({ email: "", password: "" });
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeEditorSurveyId, setActiveEditorSurveyId] = useState<string | null>(null);
  const [copiedSurveyId, setCopiedSurveyId] = useState<string | null>(null);

  useEffect(() => {
    if (!copiedSurveyId) return;
    const t = window.setTimeout(() => setCopiedSurveyId(null), 1400);
    return () => window.clearTimeout(t);
  }, [copiedSurveyId]);

  const sorted = useMemo(
    () => [...surveys].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [surveys],
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSurveys();
      const rows = (res.data?.data ?? []) as any[];
      const mapped: Survey[] = rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description ?? "",
        slug: r.slug,
        status: r.status,
        schema: r.schema ?? [],
        version: r.version ?? 1,
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString(),
        responses: r.responseCount ?? 0,
      }));
      setSurveys(mapped);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to load surveys (are you logged in?)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth.authed) {
      setLoading(false);
      setSurveys([]);
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.authed]);

  const onCreate = async () => {
    if (!draft.title.trim()) return;
    try {
      const res = await createSurvey({ title: draft.title.trim(), description: draft.description.trim(), schema: [] });
      const created = res.data?.data as any;
      setSurveys((prev) => [
        {
          id: created.id,
          title: created.title,
          description: created.description ?? "",
          slug: created.slug,
          status: created.status,
          schema: created.schema ?? [],
          version: created.version ?? 1,
          createdAt: new Date(created.createdAt).toISOString(),
          updatedAt: new Date(created.updatedAt).toISOString(),
          responses: 0,
        },
        ...prev,
      ]);
      setDraft({ title: "", description: "" });
      setShowNewModal(false);
      setActiveEditorSurveyId(created.id);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to create survey");
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteSurvey(id);
      setSurveys((prev) => prev.filter((s) => s.id !== id));
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Failed to delete survey");
    }
  };

  return (
    <div className="min-h-[100vh] bg-[var(--bg)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div>
            <h1 className="font-serif text-[28px] leading-tight text-[var(--text-primary)]">Surveys</h1>
            <p className="mt-1 text-[14.5px] text-[var(--text-secondary)]">
              Create, publish, and analyze responses in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {auth.authed ? (
              <Button
                variant="secondary"
                onClick={() => auth.logout()}
                title={auth.user?.email ?? "Logout"}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            ) : (
              <>
                <Button variant="secondary" onClick={() => { setAuthError(null); setAuthModal("login"); }}>
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
                <Button variant="secondary" onClick={() => { setAuthError(null); setAuthModal("register"); }}>
                  <Plus className="h-4 w-4" />
                  Register
                </Button>
              </>
            )}
            {auth.authed && (
              <Button variant="primary" onClick={() => setShowNewModal(true)}>
                <Plus className="h-4 w-4" />
                New Survey
              </Button>
            )}
          </div>
        </div>

        {error && (
          <Card className="mb-4 border border-[#FCA5A5] bg-[var(--danger-light)] text-[var(--danger)]">
            {error}
          </Card>
        )}

        {!auth.authed ? (
          <Card className="py-12 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)] opacity-60" />
            <div className="text-[15px] font-medium text-[var(--text-secondary)]">Login required</div>
            <div className="mt-1 text-[13px] text-[var(--text-muted)]">
              Use the Login/Register buttons to access surveys.
            </div>
          </Card>
        ) : loading ? (
          <Card className="py-10 text-center text-[13.5px] text-[var(--text-muted)]">Loading…</Card>
        ) : sorted.length === 0 ? (
          <Card className="py-12 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)] opacity-60" />
            <div className="text-[15px] font-medium text-[var(--text-secondary)]">No surveys yet</div>
            <div className="mt-1 text-[13px] text-[var(--text-muted)]">Create your first survey to get started.</div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sorted.map((s) => (
              <Card key={s.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-semibold text-[var(--text-primary)]">{s.title}</div>
                    {s.description ? (
                      <div className="mt-1 line-clamp-2 text-[13.5px] leading-6 text-[var(--text-secondary)]">
                        {s.description}
                      </div>
                    ) : (
                      <div className="mt-1 text-[13.5px] text-[var(--text-muted)]">No description</div>
                    )}
                  </div>
                  <Badge tone={s.status === "active" ? "green" : s.status === "closed" ? "red" : "gray"}>
                    {s.status === "closed" ? "inactive" : s.status}
                  </Badge>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-[12.5px] font-medium text-[var(--text-muted)]">
                    {s.responses ?? 0} responses · {new Date(s.createdAt).toISOString().slice(0, 10)}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setActiveEditorSurveyId(s.id)}
                    className="w-full justify-center"
                  >
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => (window.location.href = `/analytics/${s.id}`)}
                    className="w-full justify-center"
                  >
                    <LineChart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Analytics
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(`${location.origin}/s/${s.slug}`);
                        setCopiedSurveyId(s.id);
                      } catch {
                        // ignore
                      }
                    }}
                    disabled={s.status !== "active"}
                    className="w-full justify-center"
                  >
                    <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {copiedSurveyId === s.id ? "Copied" : "Copy link"}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => onDelete(s.id)} className="w-full justify-center">
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeEditorSurveyId && auth.authed && (
          <SurveyInlineEditor
            surveyId={activeEditorSurveyId}
            onClose={() => setActiveEditorSurveyId(null)}
            onUpdated={() => void load()}
          />
        )}

        {showNewModal && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/35 p-4"
            onClick={() => setShowNewModal(false)}
          >
            <div
              className="w-full max-w-[480px] rounded-3xl bg-white p-7 shadow-[0_8px_32px_rgba(0,0,0,0.10),0_4px_12px_rgba(0,0,0,0.06)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-serif text-[20px] text-[var(--text-primary)]">New Survey</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowNewModal(false)}>
                  ✕
                </Button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
                    Title <span className="text-[var(--danger)]">*</span>
                  </label>
                  <input
                    className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2.5 text-[14px] text-[var(--text-primary)] outline-none transition hover:border-[var(--border-hover)] focus:border-accent focus:ring-4 focus:ring-accent/10"
                    value={draft.title}
                    onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Customer Satisfaction Survey"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">
                    Description
                  </label>
                  <textarea
                    className="min-h-[70px] w-full resize-y rounded-md border border-[var(--border)] bg-white px-3 py-2.5 text-[14px] leading-6 text-[var(--text-primary)] outline-none transition hover:border-[var(--border-hover)] focus:border-accent focus:ring-4 focus:ring-accent/10"
                    value={draft.description}
                    onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                    placeholder="What's this survey about?"
                  />
                </div>

                <div className="mt-1 flex justify-end gap-2.5">
                  <Button variant="secondary" onClick={() => setShowNewModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={onCreate} disabled={!draft.title.trim()}>
                    Create Survey
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {authModal && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/35 p-4"
            onClick={() => setAuthModal(null)}
          >
            <div
              className="w-full max-w-[440px] rounded-3xl bg-white p-7 shadow-[0_8px_32px_rgba(0,0,0,0.10),0_4px_12px_rgba(0,0,0,0.06)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-serif text-[20px] text-[var(--text-primary)]">
                  {authModal === "login" ? "Login" : "Register"}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setAuthModal(null)}>
                  ✕
                </Button>
              </div>

              {authError && (
                <Card className="mb-4 border border-[#FCA5A5] bg-[var(--danger-light)] text-[var(--danger)]">
                  {authError}
                </Card>
              )}

              <div className="flex flex-col gap-3.5">
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">Email</label>
                  <input
                    className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2.5 text-[14px] text-[var(--text-primary)] outline-none transition hover:border-[var(--border-hover)] focus:border-accent focus:ring-4 focus:ring-accent/10"
                    value={authDraft.email}
                    onChange={(e) => setAuthDraft((p) => ({ ...p, email: e.target.value }))}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-[var(--text-secondary)]">Password</label>
                  <input
                    type="password"
                    className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2.5 text-[14px] text-[var(--text-primary)] outline-none transition hover:border-[var(--border-hover)] focus:border-accent focus:ring-4 focus:ring-accent/10"
                    value={authDraft.password}
                    onChange={(e) => setAuthDraft((p) => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>

                <div className="mt-1 flex justify-end gap-2.5">
                  <Button variant="secondary" onClick={() => setAuthModal(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={async () => {
                      try {
                        setAuthError(null);
                        if (authModal === "login") await auth.login(authDraft.email, authDraft.password);
                        else await auth.register(authDraft.email, authDraft.password);
                        setAuthModal(null);
                        setAuthDraft({ email: "", password: "" });
                        await load();
                      } catch (e: any) {
                        setAuthError(e?.response?.data?.error ?? "Auth failed");
                      }
                    }}
                    disabled={!authDraft.email.trim() || !authDraft.password.trim()}
                  >
                    {authModal === "login" ? "Login" : "Create account"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

