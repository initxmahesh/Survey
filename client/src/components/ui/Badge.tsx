function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

export function Badge({
  tone = "gray",
  className,
  children,
}: {
  tone?: "blue" | "green" | "red" | "gray" | "warning";
  className?: string;
  children: React.ReactNode;
}) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-medium";
  const toneClass =
    tone === "blue"
      ? "bg-accent-light text-accent"
      : tone === "green"
        ? "bg-[var(--success-light)] text-[var(--success)]"
        : tone === "red"
          ? "bg-[var(--danger-light)] text-[var(--danger)]"
          : tone === "warning"
            ? "bg-[var(--warning-light)] text-[var(--warning)]"
            : "bg-[var(--surface)] text-[var(--text-secondary)]";

  return <span className={cn(base, toneClass, className)}>{children}</span>;
}

