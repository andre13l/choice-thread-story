import { useEffect, useRef, useState } from "react";
import { canvasToBlob, careerShareText, renderCareerCard, shareFilename } from "../share";
import type { CareerSnapshot } from "../types";

type Status = "idle" | "copied" | "downloaded" | "shared" | "text" | "error";

/**
 * The share surface. Renders the card once, then offers every path the
 * browser actually supports — native share, clipboard image, download,
 * plain text — and never assumes any of them exist.
 */
export function ShareResult({ snapshot, onClose }: { snapshot: CareerSnapshot; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    let alive = true;
    renderCareerCard(snapshot)
      .then((canvas) => {
        if (!alive) return;
        canvasRef.current = canvas;
        setUrl(canvas.toDataURL("image/png"));
      })
      .catch(() => setStatus("error"));
    return () => {
      alive = false;
    };
  }, [snapshot]);

  const flash = (s: Status) => {
    setStatus(s);
    setTimeout(() => setStatus("idle"), 2200);
  };

  const getBlob = async (): Promise<Blob | null> =>
    canvasRef.current ? canvasToBlob(canvasRef.current) : null;

  const nativeShare = async () => {
    try {
      const blob = await getBlob();
      const text = careerShareText(snapshot);
      const file = blob ? new File([blob], shareFilename(snapshot), { type: "image/png" }) : null;
      const nav = navigator as Navigator & {
        canShare?: (d: ShareData) => boolean;
        share?: (d: ShareData) => Promise<void>;
      };
      if (file && nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], text });
        flash("shared");
        return;
      }
      if (nav.share) {
        await nav.share({ text });
        flash("shared");
        return;
      }
      await copyText();
    } catch {
      /* user dismissed or unsupported */
    }
  };

  const copyImage = async () => {
    try {
      const blob = await getBlob();
      const w = window as Window & { ClipboardItem?: typeof ClipboardItem };
      if (!blob || !w.ClipboardItem || !navigator.clipboard?.write) return download();
      await navigator.clipboard.write([new w.ClipboardItem({ "image/png": blob })]);
      flash("copied");
    } catch {
      download();
    }
  };

  const download = () => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = shareFilename(snapshot);
    a.click();
    flash("downloaded");
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(careerShareText(snapshot));
      flash("text");
    } catch {
      flash("error");
    }
  };

  const label = (base: string, when: Status) => (status === when ? "Done" : base);
  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/95 px-4 py-10 backdrop-blur-sm">
      <div className="anim-fade-up w-full max-w-sm">
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Your career
        </p>

        <div className="mt-6 border border-border/70 bg-card/40">
          {url ? (
            <img src={url} alt="Hollywood career result card" className="block w-full" />
          ) : (
            <div className="flex aspect-[1080/1350] items-center justify-center text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              {status === "error" ? "Card unavailable" : "Developing…"}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {canNativeShare && (
            <button
              onClick={nativeShare}
              className="border border-foreground bg-foreground px-8 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] text-primary-foreground transition-colors hover:bg-transparent hover:text-foreground"
            >
              {label("Share", "shared")}
            </button>
          )}
          <button
            onClick={copyImage}
            className="border border-border px-8 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] text-foreground transition-colors hover:border-foreground"
          >
            {label("Copy image", "copied")}
          </button>
          <button
            onClick={download}
            className="border border-border px-8 py-3.5 text-[12px] font-medium uppercase tracking-[0.3em] text-foreground transition-colors hover:border-foreground"
          >
            {label("Download", "downloaded")}
          </button>
          <button
            onClick={copyText}
            className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground"
          >
            {status === "text" ? "Copied" : "Copy as text"}
          </button>
          <button
            onClick={onClose}
            className="mt-2 text-[11px] uppercase tracking-[0.24em] text-muted-foreground/70 transition-colors hover:text-foreground"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
