/**
 * One-time local reset for the Up & Down survival cutover.
 *
 * 2026-08-21 shipped as a 10-round accuracy round before it became the first
 * survival date. Anyone who already finished the old format that day must be
 * able to play the new chain once; nothing else is touched.
 */
import { SITE } from "@/config/site";
import { clearProgress } from "@/games/core/dailyProgress";
import { forgetDaily } from "@/games/core/dailyStats";
import { forgetRankable } from "@/games/core/rankable";
import { UPDOWN_FORMAT_VERSION, UPDOWN_GAME_ID, UPDOWN_SURVIVAL_FROM } from "./types";

const FLAG = `${SITE.storagePrefix}.daily.${UPDOWN_GAME_ID}.format`;

/** Returns true when local state for `date` was cleared by this call. */
export function resetLegacyUpDown(date: string): boolean {
  if (date !== UPDOWN_SURVIVAL_FROM) return false;
  try {
    if (Number(window.localStorage.getItem(FLAG) ?? 1) >= UPDOWN_FORMAT_VERSION) return false;
    clearProgress(UPDOWN_GAME_ID);
    forgetDaily(UPDOWN_GAME_ID, date);
    forgetRankable(UPDOWN_GAME_ID, date);
    window.localStorage.setItem(FLAG, String(UPDOWN_FORMAT_VERSION));
    return true;
  } catch {
    return false;
  }
}
