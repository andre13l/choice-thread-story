import { useEffect, useState } from "react";
import { REPORT_LABELS, submitReport, type ReportKind } from "../reports";

export interface ReportContext {
  kind: ReportKind;
  movieId?: string | null;
  personId?: string | null;
  /** Human-readable context shown to the reporter and stored with the report. */
  subject?: string;
}

const KINDS: ReportKind[] = [
  "actor_missing_from_movie",
  "movie_missing",
  "actor_missing",
  "wrong_connection",
  "other",
];

/**
 * Anonymous "something's missing" form. No login, one insert, rate-limited
 * server-side.
 */
export function ReportDialog({
  open,
  context,
  onClose,
}: {
  open: boolean;
  context: ReportContext;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<ReportKind>(context.kind);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setKind(context.kind);
      setMessage("");
      setState("idle");
      setError("");
    }
  }, [open, context.kind]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const send = async () => {
    setState("sending");
    const result = await submitReport({
      kind,
      message,
      movieId: context.movieId ?? null,
      personId: context.personId ?? null,
      context: { subject: context.subject ?? "", surface: "connect" },
    });
    if (result.ok) {
      setState("sent");
      window.setTimeout(onClose, 1600);
    } else {
      setState("error");
      setError(result.error ?? "Something went wrong.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Report missing data"
      onClick={onClose}
    >
      <div
        className="anim-fade-up max-h-[90vh] w-full max-w-lg overflow-y-auto border border-border/80 bg-card px-5 py-6 sm:px-7 sm:py-8"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[9px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          Help us improve the graph
        </p>
        <h2 className="mt-2 font-display text-xl font-semibold tracking-[0.04em] text-foreground">
          Spot something missing?
        </h2>
        {context.subject && (
          <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-link">{context.subject}</p>
        )}

        {state === "sent" ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Thank you — that's been sent to us.
          </p>
        ) : (
          <>
            <div className="mt-6 space-y-2">
              {KINDS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setKind(option)}
                  className={[
                    "block w-full border px-4 py-2.5 text-left text-[12px] transition-colors",
                    kind === option
                      ? "border-link/60 bg-link/10 text-foreground"
                      : "border-border/60 text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {REPORT_LABELS[option]}
                </button>
              ))}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Which actor or film, and where should it appear?"
              className="mt-5 w-full resize-none border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-link/60"
            />

            {state === "error" && <p className="mt-3 text-[12px] text-destructive">{error}</p>}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void send()}
                disabled={state === "sending" || message.trim().length < 3}
                className="border border-link bg-link px-7 py-2.5 text-[11px] font-medium uppercase tracking-[0.24em] text-link-foreground transition-colors hover:bg-transparent hover:text-link disabled:opacity-40"
              >
                {state === "sending" ? "Sending…" : "Send report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
