/**
 * DAILY UP & DOWN — server-side view of the daily path.
 *
 * The generation itself lives in `./path` and is deliberately client-safe, so
 * the game can start without any backend round-trip. This module exists only
 * for server functions and scripts that want the same values.
 */
export { cardKey, franchiseKey, loadUpDownPrompt, upDownSequence } from "./path";
