import { useEffect, useState } from "react";
import { SITE } from "@/config/site";
import { FeedbackDialog } from "./FeedbackDialog";

/** Bump the suffix to show a new banner to everyone. */
const DISMISS_KEY = `${SITE.storagePrefix}.banner.evolving-1`;
/** A dismissal lasts this long, then the invitation may return. */
const DISMISS_DAYS = 45;

function dismissed(): boolean {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return true;
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * Compact site-wide invitation to influence the next round of updates.
 * Dismissal is remembered locally, so it never nags within a session.
 */
export function UpdateBanner() {
  const [visible, setVisible] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    setVisible(!dismissed());
  }, []);

  const close = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Dismissal memory is a nicety.
    }
  };

  return (
    <>
      {visible && (
        <div className="border-b border-border/70 bg-card/60">
          <div className="mx-auto flex w-full max-w-5xl items-start gap-3 px-4 py-2.5 sm:items-center sm:px-6">
            <p className="min-w-0 flex-1 text-[12px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">NIRCOSI is evolving.</span>{" "}
              <span className="hidden sm:inline">
                We&apos;re working on major updates to Hollywood and the Daily games, and
                we&apos;d love your input.{" "}
              </span>
              Help shape what comes next.
            </p>
            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              className="shrink-0 border-b border-link pb-0.5 text-[10px] font-medium uppercase tracking-[0.22em] text-link transition-colors hover:text-foreground"
            >
              Share feedback
            </button>
            <button
              type="button"
              onClick={close}
              aria-label="Dismiss"
              className="shrink-0 px-1 text-[15px] leading-none text-muted-foreground transition-colors hover:text-foreground"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
}
