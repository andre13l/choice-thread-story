/**
 * Film financial model — single source of truth.
 *
 * A film's gross is not what a studio keeps. Exhibitors keep roughly half
 * of every theatrical ticket; the studio's share of the gross is "rentals".
 * The studio result is that share minus the production budget (marketing is
 * carved out of the same budget elsewhere in the model).
 *
 * Both the engine and every UI surface MUST use these helpers so the number
 * on screen can never drift from the number the career is built on.
 */

/** Studio's share of the worldwide gross, by release type. */
export const RENTALS_SHARE = {
  theatrical: 0.47,
  nonTheatrical: 0.85,
} as const;

export function rentalsShare(theatrical: boolean): number {
  return theatrical ? RENTALS_SHARE.theatrical : RENTALS_SHARE.nonTheatrical;
}

/** The studio's share of the gross, before the budget is subtracted. */
export function studioRentals(worldwide: number, theatrical: boolean): number {
  return Math.round(worldwide * rentalsShare(theatrical));
}

/** Studio's result on the film: rentals minus the production budget. */
export function studioResultOf(worldwide: number, budget: number, theatrical: boolean): number {
  return Math.round(worldwide * rentalsShare(theatrical)) - budget;
}

/** Player-facing explanation of where the studio number comes from. */
export function splitLabel(theatrical: boolean): string {
  return `${Math.round(rentalsShare(theatrical) * 100)}% of gross`;
}
