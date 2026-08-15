/**
 * Career share card.
 *
 * Rendered client-side onto a canvas so the result is deterministic from a
 * finished career and needs no server, no fonts beyond the ones the page
 * already loaded, and no screenshot of the UI.
 */

import { SITE } from "@/config/site";
import { formatMoney } from "../scoring";
import type { CareerSnapshot } from "./types";

export const CARD_W = 1080;
export const CARD_H = 1350;

const BG = "#F4F1EA";
const PANEL = "#EDE9E0";
const LINE = "#D8D2C6";
const FG = "#111111";
const MUTED = "#6E675E";
const GOLD = "#A52430";
const DANGER = "#A52430";

const DISPLAY = '"Chakra Petch", "Space Grotesk", system-ui, sans-serif';
const UI = '"Space Grotesk", system-ui, sans-serif';

function track(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  align: "left" | "center" = "left",
): void {
  const chars = [...text];
  const width =
    chars.reduce((a, ch) => a + ctx.measureText(ch).width, 0) + spacing * (chars.length - 1);
  let cx = align === "center" ? x - width / 2 : x;
  for (const ch of chars) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number, limit: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > max && line) {
      lines.push(line);
      line = w;
      if (lines.length === limit) return lines;
    } else {
      line = test;
    }
  }
  if (line && lines.length < limit) lines.push(line);
  return lines;
}

function percentileLabel(p: number): string {
  const top = 100 - p;
  return `TOP ${top <= 0.01 ? "0.01" : top.toFixed(top < 1 ? 2 : 1)}%`;
}

async function fontsReady(): Promise<void> {
  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
  } catch {
    /* fonts API unavailable */
  }
}

/** Draws the card. Pure canvas — safe to call repeatedly. */
export async function renderCareerCard(s: CareerSnapshot): Promise<HTMLCanvasElement> {
  await fontsReady();
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Warm pool of light behind the headline.
  const glow = ctx.createRadialGradient(CARD_W / 2, 330, 40, CARD_W / 2, 330, 700);
  glow.addColorStop(0, "rgba(165,36,48,0.07)");
  glow.addColorStop(1, "rgba(165,36,48,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, CARD_W - 80, CARD_H - 80);

  const cx = CARD_W / 2;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // Brand
  ctx.font = `500 22px ${UI}`;
  ctx.fillStyle = MUTED;
  track(ctx, SITE.name.toUpperCase(), cx, 122, 9, "center");
  ctx.font = `700 26px ${DISPLAY}`;
  ctx.fillStyle = GOLD;
  track(ctx, "HOLLYWOOD", cx, 166, 12, "center");

  // Headline
  ctx.font = `700 84px ${DISPLAY}`;
  ctx.fillStyle = FG;
  ctx.textAlign = "center";
  const head = wrap(ctx, s.archetype.toUpperCase(), CARD_W - 200, 2);
  let y = head.length > 1 ? 282 : 316;
  for (const l of head) {
    ctx.fillText(l, cx, y);
    y += 90;
  }

  // Span line
  ctx.font = `500 26px ${UI}`;
  ctx.fillStyle = MUTED;
  track(
    ctx,
    `${s.films} ${s.films === 1 ? "FILM" : "FILMS"} · ${s.spanYears} ${s.spanYears === 1 ? "YEAR" : "YEARS"} · AGE ${s.age}`,
    cx,
    head.length > 1 ? 452 : 400,
    6,
    "center",
  );

  // Fate
  ctx.font = `italic 30px ${UI}`;
  ctx.fillStyle = "#3A342D";
  let fy = head.length > 1 ? 520 : 470;
  for (const l of wrap(ctx, s.fate, CARD_W - 220, 2)) {
    ctx.fillText(l, cx, fy);
    fy += 42;
  }

  // Stat grid
  const cells: [string, string, string][] = [
    ["Worldwide", formatMoney(s.totalBoxOffice), FG],
    ["Oscars", String(s.oscars), s.oscars > 0 ? GOLD : FG],
    ["Peak net worth", formatMoney(s.peakMoney), FG],
    ["Final net worth", formatMoney(s.finalMoney), s.finalMoney < 0 ? DANGER : FG],
    ["Avg critics", `${s.avgCritics}`, FG],
    ["Career score", s.score.toLocaleString("en-US"), FG],
  ];
  const gridTop = 540;
  const rowH = 100;
  const colW = (CARD_W - 160) / 2;
  cells.forEach(([label, value, color], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 80 + col * colW;
    const ry = gridTop + row * rowH;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, ry, colW, rowH);
    ctx.textAlign = "left";
    ctx.font = `500 19px ${UI}`;
    ctx.fillStyle = MUTED;
    track(ctx, label.toUpperCase(), x + 28, ry + 40, 4);
    ctx.font = `700 46px ${DISPLAY}`;
    ctx.fillStyle = color;
    ctx.fillText(value, x + 26, ry + 86);
  });

  // Film lines
  let ly = gridTop + 3 * rowH + 46;
  const filmLine = (label: string, title: string, right: string, color: string) => {
    ctx.textAlign = "left";
    ctx.font = `500 19px ${UI}`;
    ctx.fillStyle = MUTED;
    track(ctx, label.toUpperCase(), 82, ly, 4);
    ctx.font = `700 34px ${DISPLAY}`;
    ctx.fillStyle = FG;
    const t = title.length > 26 ? `${title.slice(0, 25)}…` : title;
    ctx.fillText(t, 80, ly + 44);
    ctx.textAlign = "right";
    ctx.fillStyle = color;
    ctx.fillText(right, CARD_W - 80, ly + 44);
    ctx.strokeStyle = LINE;
    ctx.beginPath();
    ctx.moveTo(80, ly + 74);
    ctx.lineTo(CARD_W - 80, ly + 74);
    ctx.stroke();
    ly += 104;
  };

  if (s.biggestHit) filmLine("Biggest hit", s.biggestHit.title, formatMoney(s.biggestHit.worldwide), GOLD);
  if (s.finalFilm)
    filmLine(
      "Final film",
      s.finalFilm.title,
      `${formatMoney(s.finalFilm.budget)} → ${formatMoney(s.finalFilm.worldwide)}`,
      s.finalFilm.worldwide < s.finalFilm.budget ? DANGER : FG,
    );

  // Footer
  ctx.fillStyle = PANEL;
  ctx.fillRect(41, CARD_H - 200, CARD_W - 82, 159);
  ctx.strokeStyle = LINE;
  ctx.strokeRect(41, CARD_H - 200, CARD_W - 82, 159);
  ctx.textAlign = "center";
  ctx.font = `700 40px ${DISPLAY}`;
  ctx.fillStyle = FG;
  ctx.fillText("Can you survive Hollywood?", cx, CARD_H - 130);
  ctx.font = `500 21px ${UI}`;
  ctx.fillStyle = GOLD;
  track(ctx, percentileLabel(s.percentile), cx, CARD_H - 86, 7, "center");
  ctx.fillStyle = MUTED;
  track(ctx, `${SITE.name.toUpperCase()} · HOLLYWOOD`, cx, CARD_H - 58, 7, "center");

  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export function shareFilename(s: CareerSnapshot): string {
  return `${SITE.name.toLowerCase()}-hollywood-${s.films}films-${s.age}.png`;
}

export function careerShareText(s: CareerSnapshot): string {
  const lines = [
    `${SITE.name} — HOLLYWOOD`,
    "",
    `${s.films} films · ${s.spanYears} years`,
    `${formatMoney(s.totalBoxOffice)} worldwide`,
    `${s.oscars} ${s.oscars === 1 ? "Oscar" : "Oscars"}`,
  ];
  if (s.biggestHit) lines.push(`Biggest hit: ${formatMoney(s.biggestHit.worldwide)}`);
  if (s.finalFilm)
    lines.push(
      `Final film: ${formatMoney(s.finalFilm.budget)} → ${formatMoney(s.finalFilm.worldwide)}`,
    );
  lines.push("", s.fate, "", "Can you survive Hollywood?");
  return lines.join("\n");
}
