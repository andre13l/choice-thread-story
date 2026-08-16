/**
 * CONNECT — portrait resolution.
 *
 * People carry a Wikimedia Commons file name (from Wikidata P18). We render
 * the image straight from Commons' `Special:FilePath` endpoint at a bounded
 * width — nothing is copied into our storage, and every file keeps a link
 * back to its Commons file page, which carries the licence and author.
 *
 * Licensing varies per file (CC BY, CC BY-SA, CC0, public domain), so we
 * always surface attribution rather than assuming a single licence.
 */

const BASE = "https://commons.wikimedia.org";

/**
 * Stored file names arrive percent-encoded from the Wikidata dump; encoding
 * them again would produce a 404, so decode defensively first.
 */
function fileSegment(file: string): string {
  let decoded = file;
  try {
    decoded = decodeURIComponent(file);
  } catch {
    // Not valid percent-encoding — use it verbatim.
  }
  return encodeURIComponent(decoded.replace(/ /g, "_"));
}

export function portraitUrl(file: string, width: number): string | null {
  if (!file) return null;
  return `${BASE}/wiki/Special:FilePath/${fileSegment(file)}?width=${width}`;
}

/** Commons file page — the canonical place for author + licence. */
export function attributionUrl(file: string): string | null {
  if (!file) return null;
  return `${BASE}/wiki/File:${fileSegment(file)}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
