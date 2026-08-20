import { useEffect, useState } from "react";
import { submitReport } from "@/games/connect/reports";

const TOPICS = [
  { id: "hollywood", label: "Hollywood" },
  { id: "daily", label: "The Daily games" },
  { id: "connect", label: "Connect" },
  { id: "site", label: "Something else" },
] as const;

type Topic = (typeof TOPICS)[number]["id"];

/**
 * General site feedback. Same anonymous, rate-limited insert as the Connect
 * report form — stored in `connect_reports` with kind "other" and a
 * `surface: "site-feedback"` context so it's easy to separate from graph
 * reports.
 */
export function FeedbackDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [topic, setTopic] = useState<Topic>("hollywood");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTopic("hollywood");
      setMessage("");
      setState("idle");
      setError("");
    }
  }, [open]);

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
      kind: "other",
      message,
      context: { surface: "site-feedback", topic },
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
      className="fixed inset-0 z-[60] flex items-end justify-center bg-background/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Share feedback"
      onClick={onClose}
    >
      <div
        className="anim-fade-up max-h-[90vh] w-full max-w-lg overflow-y-auto border border-border/80 bg-card px-5 py-6 sm:px-7 sm:py-8"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[9px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          Shape what comes next
        </p>
        <h2 className="mt-2 font-display text-xl font-semibold tracking-[0.04em] text-foreground">
          Share feedback
        </h2>

        {state === "sent" ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Thank you — that's been sent to us.
          </p>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {TOPICS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTopic(option.id)}
                  className={[
                    "border px-4 py-2.5 text-left text-[12px] transition-colors",
                    topic === option.id
                      ? "border-link/60 bg-link/10 text-foreground"
                      : "border-border/60 text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              rows={5}
              placeholder="What would you change, add, or keep exactly as it is?"
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
                {state === "sending" ? "Sending…" : "Send"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
