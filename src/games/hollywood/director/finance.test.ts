import { describe, expect, it } from "vitest";
import { rentalsShare, studioRentals, studioResultOf } from "./finance";
import { resolveFilm } from "./resolve";
import { newCareer } from "./career";
import { generateOffers } from "./offers";
import { generateCast } from "./casting";

describe("studio financial model", () => {
  it("keeps 47% of a theatrical gross before the budget", () => {
    expect(rentalsShare(true)).toBe(0.47);
    expect(studioRentals(543_000, true)).toBe(255_210);
    expect(studioResultOf(543_000, 580_000, true)).toBe(-324_790);
    expect(studioResultOf(278_000, 360_000, true)).toBe(-229_340);
    expect(studioResultOf(1_800_000, 1_900_000, true)).toBe(-1_054_000);
  });

  it("keeps 85% of non-theatrical revenue", () => {
    expect(studioResultOf(1_000_000, 500_000, false)).toBe(350_000);
  });

  it("engine studioResult always matches the shared helper", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const career = newCareer(seed);
      const project = generateOffers(career)[0]!;
      const cast = generateCast(project, career).slice(0, 2);
      const film = resolveFilm({
        project,
        cast,
        alloc: { cast: 35, production: 45, marketing: 20 },
        career,
      });
      expect(film.studioResult).toBe(
        studioResultOf(film.worldwide, film.budget, film.theatrical !== false),
      );
    }
  });
});
