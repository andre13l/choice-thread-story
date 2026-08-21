/** The single share control used by every NIRCOSI result surface. */
import { useState } from "react";
import {
  canCopyImage,
  canNativeShare,
  copyShareImage,
  copyShareText,
  downloadShareImage,
  nativeShare,
  type SharePayload,
  type ShareOutcome,
} from "@/games/core/share";

const MESSAGE: Record<Exclude<ShareOutcome, "shared">, string> = {
  copied: "Copied",
  "copied-image": "Image copied",
  downloaded: "Saved",
  failed: "Copy failed",
};

export function ShareMenu({
  payload,
  buttonClass,
  className = "",
  label = "Share result",
  allowDownload = false,
}: {
  payload: SharePayload;
  buttonClass: string;
  className?: string;
  label?: string;
  allowDownload?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const flash = (outcome: ShareOutcome) => {
    if (outcome !== "shared") setStatus(MESSAGE[outcome]);
    window.setTimeout(() => setStatus(null), 2000);
  };

  const primary = async () => {
    const outcome = await nativeShare(payload);
    if (outcome) {
      flash(outcome);
      return;
    }
    // Desktop / unsupported Web Share: open explicit options. Never mailto.
    setOpen((value) => !value);
  };

  const hasImage = Boolean(payload.image);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <button
        onClick={primary}
        aria-expanded={open}
        className={`border px-10 py-3 text-[11px] font-medium uppercase tracking-[0.26em] transition-colors ${buttonClass}`}
      >
        {status ?? label}
      </button>

      {open && (
        <div className="mt-3 flex w-full max-w-xs flex-col divide-y divide-border/70 border border-border/70 bg-card/60">
          <button
            onClick={async () => flash(await copyShareText(payload))}
            className="px-5 py-3 text-[11px] uppercase tracking-[0.22em] text-foreground transition-colors hover:bg-muted/40"
          >
            Copy result text
          </button>
          {hasImage && canCopyImage() && (
            <button
              onClick={async () => flash(await copyShareImage(payload))}
              className="px-5 py-3 text-[11px] uppercase tracking-[0.22em] text-foreground transition-colors hover:bg-muted/40"
            >
              Copy image
            </button>
          )}
          {hasImage && allowDownload && (
            <button
              onClick={async () => flash(await downloadShareImage(payload))}
              className="px-5 py-3 text-[11px] uppercase tracking-[0.22em] text-foreground transition-colors hover:bg-muted/40"
            >
              Download image
            </button>
          )}
          {!canNativeShare() && (
            <p className="px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
              Paste anywhere — Reddit, X, Instagram
            </p>
          )}
        </div>
      )}
    </div>
  );
}
