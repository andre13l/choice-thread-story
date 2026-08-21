import { useEffect, useRef, useState } from "react";
import { ShareMenu } from "@/games/core/components/ShareMenu";
import { canvasToBlob, careerShareText, renderCareerCard, shareFilename } from "../share";
import type { CareerSnapshot } from "../types";

/**
 * The share surface. Renders the card once, then hands every share path to the
 * shared NIRCOSI share helper — native sheet on mobile, explicit copy/download
 * menu on desktop, never a mail composer.
 */
export function ShareResult({ snapshot, onClose }: { snapshot: CareerSnapshot; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    renderCareerCard(snapshot)
      .then((canvas) => {
        if (!alive) return;
        canvasRef.current = canvas;
        setUrl(canvas.toDataURL("image/png"));
      })
      .catch(() => setFailed(true));
    return () => {
      alive = false;
    };
  }, [snapshot]);

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
              {failed ? "Card unavailable" : "Developing…"}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col items-center gap-4">
          <ShareMenu
            payload={{
              text: careerShareText(snapshot),
              filename: shareFilename(snapshot),
              image: async () => (canvasRef.current ? canvasToBlob(canvasRef.current) : null),
            }}
            allowDownload
            buttonClass="w-full border-foreground bg-foreground text-primary-foreground hover:bg-transparent hover:text-foreground"
            className="w-full"
            label="Share"
          />
          <button
            onClick={onClose}
            className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/70 transition-colors hover:text-foreground"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
