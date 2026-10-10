/** Helpers for descriptions that may be plain text (older entries) or HTML from the rich editor. Safe for client and server. */
const TAG = /<\/?[a-z][a-z0-9]*(\s[^>]*)?\/?>/i;
const ESCAPED_TAG = /&lt;\/?[a-z][a-z0-9]*(\s[^>]*?)?\/?&gt;/i;

export const looksLikeHtml = (v: string) => TAG.test(v);

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const unesc = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

/** Always returns HTML: editor HTML as-is, double-escaped HTML decoded once, plain text wrapped in paragraphs. */
export function toHtml(v: string | null | undefined): string {
  if (!v) return "";
  if (looksLikeHtml(v)) return v;
  if (ESCAPED_TAG.test(v)) return unesc(v);
  return v.split(/\n+/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join("");
}

/** Plain-text version for card excerpts and search. */
export function toText(v: string | null | undefined): string {
  if (!v) return "";
  const html = toHtml(v);
  return html
    .replace(/<img[^>]*>/gi, " ")
    .replace(/<\/(p|li|h[1-6]|blockquote|div|tr|td|th)>|<br\s*\/?>|<hr\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ").trim();
}

export const isEmptyRich = (v: string | null | undefined) => !v || (toText(v) === "" && !/<(img|hr|table)\b/i.test(v));
