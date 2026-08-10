import type { ReactNode } from "react";
import type { GameState } from "../types";
import { StatHeader } from "./StatHeader";

/** Full-screen cinematic scene: atmosphere layers + optional career HUD. */
export function ScreenShell({ game, children }: { game?: GameState; children: ReactNode }) {
  return (
    <div className="stage flex min-h-screen flex-col">
      {game && <StatHeader game={game} />}
      {children}
    </div>
  );
}
