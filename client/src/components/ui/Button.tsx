import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

function cn(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap rounded-md font-medium transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        size === "sm" && "px-2.5 py-1.5 text-[12.5px] rounded",
        size === "md" && "px-4 py-2 text-[13.5px]",
        size === "lg" && "px-5 py-2.5 text-[15px] rounded-2xl",
        size === "icon" && "p-2 rounded",
        variant === "primary" &&
          "bg-accent text-white hover:bg-accent-hover hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(37,99,235,0.3)]",
        variant === "secondary" &&
          "bg-white text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--surface)] hover:border-[var(--border-hover)]",
        variant === "ghost" &&
          "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]",
        variant === "danger" &&
          "bg-[var(--danger-light)] text-[var(--danger)] hover:bg-[#FEE2E2]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

