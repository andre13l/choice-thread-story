/**
 * CONNECT identity. Working title — kept here so a rename is one line.
 */
export const CONNECT = {
  name: "CONNECT",
  kicker: "Six degrees of cinema",
  tagline: "Reach the target actor through the films they made. Fewest clicks wins.",
  /** Challenge difficulty window, in clicks along the optimal route. */
  minClicks: 4,
  maxClicks: 8,
} as const;
