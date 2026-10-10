import sanitizeHtml from "sanitize-html";
import { toHtml } from "./rich";

const align = [/^(left|right|center|justify)$/i];

/** Server-side allow-list sanitizer for editor HTML. */
export function safeHtml(input: string): string {
  return sanitizeHtml(toHtml(input), {
    allowedTags: [
      "p", "br", "strong", "b", "em", "i", "u", "s", "h1", "h2", "h3", "h4",
      "ul", "ol", "li", "blockquote", "a", "img", "hr", "code", "pre",
      "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
      p: ["style"], h1: ["style"], h2: ["style"], h3: ["style"], h4: ["style"],
    },
    allowedStyles: {
      "*": { "text-align": align },
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https"] },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    },
  });
}
