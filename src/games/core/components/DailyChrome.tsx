/** Shared chrome for every NIRCOSI daily: header, stat blocks, share button. */
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

type Accent = "link" | "gold" | "ink";

const ACCENT_TEXT: Record<Accent, string> = {
  link: "text-link",
  gold: "text-gold",
  ink: "text-foreground",
};

const ACCENT_RULE: Record<Accent, string> = {
  link: "bg-link/70",
  gold: "bg-gold/70",
  ink: "bg-foreground/60",
};

const ACCENT_BUTTON: Record<Accent, string> = {
  link: "border-link bg-link text-link-foreground hover:bg-transparent hover:text-link",
  gold: "border-gold bg-gold text-gold-foreground hover:bg-transparent hover:text-gold",
  ink: "border-foreground bg-foreground text-background hover:bg-transparent hover:text-foreground",
};

export function accentButton(accent: Accent): string {
  return ACCENT_BUTTON[accent];
}

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function prettyDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * When a run ends the result view replaces the board, but the window keeps the
 * scroll offset from gameplay — so the headline and share CTA can sit above the
 * fold. Pull the page to the top of the result card once, on mount only, so it
 * never interrupts an in-progress game.
 */
export function useResultFocus<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      const reduce =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const top = el.getBoundingClientRect().top + window.scrollY - 16;
      window.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
      el.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(raf);
  }, []);
  return ref;
}

/** Centered, focusable container for any end-of-run result card. */
export function ResultSurface({
  children,
  className = "",
  label = "Result",
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  const ref = useResultFocus<HTMLDivElement>();
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="region"
      aria-label={label}
      className={`w-full max-w-2xl outline-none ${className}`}
    >
      {children}
    </div>
  );
}

export function DailyHeader({
  label,
  date,
  accent = "link",
}: {
  label: string;
  date: string;
  accent?: Accent;
}) {
  return (
    <>
      <p
        className={`text-[11px] font-medium uppercase tracking-[0.3em] ${ACCENT_TEXT[accent]}`}
      >
        {label}
      </p>
      <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
        {prettyDate(date)}
      </p>
      <div className={`mx-auto mt-6 h-px w-14 ${ACCENT_RULE[accent]}`} />
    </>
  );
}

export function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="border-r border-border/70 px-3 py-4 last:border-r-0">
      <p className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p
        className={`mt-2 font-display text-xl tracking-[0.08em] ${
          accent ? "text-gold" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function ShareButton({
  text,
  accent = "link",
  children,
}: {
  text: string;
  accent?: Accent;
  children?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Cancelled — nothing to do.
    }
  };
  return (
    <button
      onClick={share}
      className={`mt-10 border px-10 py-3 text-[11px] font-medium uppercase tracking-[0.26em] transition-colors ${ACCENT_BUTTON[accent]}`}
    >
      {copied ? "Copied" : (children ?? "Share result")}
    </button>
  );
}

export function DailyFooterLinks({ extra }: { extra?: ReactNode }) {
  return (
    <div className="mt-10 flex flex-wrap justify-center gap-5">
      {extra}
      <Link
        to="/daily"
        className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
      >
        All dailies
      </Link>
      <Link
        to="/"
        className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
      >
        All games
      </Link>
    </div>
  );
}

export function NextDailyNote() {
  return (
    <p className="mt-6 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
      Next daily at midnight UTC
    </p>
  );
}
