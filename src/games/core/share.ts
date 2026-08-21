/**
 * One sharing implementation for every NIRCOSI result surface.
 *
 * Rules:
 *  - native share sheet only where it is genuinely a share sheet (touch /
 *    mobile UA with `navigator.share`);
 *  - on desktop we NEVER hand off to the OS, because that is what opened a
 *    mail composer instead of sharing;
 *  - explicit fallbacks: copy image (when supported), copy text/link.
 */

export interface SharePayload {
  /** Plain-text result block, already formatted for Reddit/X/Instagram. */
  text: string;
  /** Absolute or relative URL appended to the text when copying. */
  url?: string | undefined;
  /** Optional generated result card. */
  image?: (() => Promise<Blob | null>) | undefined;
  filename?: string | undefined;
}

export function shareBody(payload: SharePayload): string {
  const url = payload.url
    ? payload.url.startsWith("http") || typeof window === "undefined"
      ? payload.url
      : `${window.location.origin}${payload.url}`
    : null;
  return url ? `${payload.text}\n${url}` : payload.text;
}

/** True only where a real native share sheet exists (phones/tablets). */
export function canNativeShare(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  const coarse =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  return coarse;
}

export function canCopyImage(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof (window as { ClipboardItem?: unknown }).ClipboardItem === "function" &&
    typeof navigator !== "undefined" &&
    typeof navigator.clipboard?.write === "function"
  );
}

export type ShareOutcome = "shared" | "copied" | "copied-image" | "downloaded" | "failed";

export async function copyShareText(payload: SharePayload): Promise<ShareOutcome> {
  try {
    await navigator.clipboard.writeText(shareBody(payload));
    return "copied";
  } catch {
    return "failed";
  }
}

export async function copyShareImage(payload: SharePayload): Promise<ShareOutcome> {
  if (!payload.image || !canCopyImage()) return copyShareText(payload);
  try {
    const blob = await payload.image();
    if (!blob) return copyShareText(payload);
    const Item = (window as unknown as { ClipboardItem: typeof ClipboardItem }).ClipboardItem;
    await navigator.clipboard.write([new Item({ "image/png": blob })]);
    return "copied-image";
  } catch {
    return copyShareText(payload);
  }
}

export async function downloadShareImage(payload: SharePayload): Promise<ShareOutcome> {
  if (!payload.image) return "failed";
  try {
    const blob = await payload.image();
    if (!blob) return "failed";
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = payload.filename ?? "nircosi.png";
    anchor.click();
    URL.revokeObjectURL(href);
    return "downloaded";
  } catch {
    return "failed";
  }
}

/** Native sheet where available; otherwise the caller shows the share menu. */
export async function nativeShare(payload: SharePayload): Promise<ShareOutcome | null> {
  if (!canNativeShare()) return null;
  try {
    const blob = payload.image ? await payload.image() : null;
    const file = blob
      ? new File([blob], payload.filename ?? "nircosi.png", { type: "image/png" })
      : null;
    const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
    const data: ShareData =
      file && nav.canShare?.({ files: [file] })
        ? { files: [file], text: shareBody(payload) }
        : { text: shareBody(payload) };
    await nav.share!(data);
    return "shared";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "shared";
    return null;
  }
}
