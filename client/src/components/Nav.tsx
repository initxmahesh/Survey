import { BarChart3, Eye, Grid3X3, Link2, Check } from "lucide-react";
import { Button } from "./ui/Button";

export function Nav({
  active,
  onChange,
}: {
  active: "builder" | "preview" | "analytics";
  onChange: (next: "builder" | "preview" | "analytics") => void;
}) {
  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-white px-4 sm:px-7">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-3 py-3 sm:h-[58px] sm:flex-row sm:items-center sm:justify-between sm:py-0">
        <div className="flex flex-wrap items-center gap-3 sm:gap-8">
          <span className="font-serif text-[20px] italic text-[var(--text-primary)]">formly.</span>

          <div className="flex gap-0.5 rounded-md bg-[var(--surface)] p-1">
            <button
              className={[
                "flex items-center gap-2 rounded px-3 py-2 text-[13.5px] font-medium transition sm:px-3.5",
                active === "builder"
                  ? "bg-white text-[var(--text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              ].join(" ")}
              onClick={() => onChange("builder")}
              type="button"
            >
              <Grid3X3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Builder</span>
            </button>
            <button
              className={[
                "flex items-center gap-2 rounded px-3 py-2 text-[13.5px] font-medium transition sm:px-3.5",
                active === "preview"
                  ? "bg-white text-[var(--text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              ].join(" ")}
              onClick={() => onChange("preview")}
              type="button"
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </button>
            <button
              className={[
                "flex items-center gap-2 rounded px-3 py-2 text-[13.5px] font-medium transition sm:px-3.5",
                active === "analytics"
                  ? "bg-white text-[var(--text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              ].join(" ")}
              onClick={() => onChange("analytics")}
              type="button"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Analytics</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2.5 sm:justify-end">
          <Button size="sm" variant="secondary">
            <Link2 className="h-[13px] w-[13px]" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button size="sm" variant="primary">
            <Check className="h-[13px] w-[13px]" />
            <span className="hidden sm:inline">Publish</span>
          </Button>
          <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-accent text-[13px] font-semibold text-white">
            A
          </div>
        </div>
      </div>
    </nav>
  );
}

