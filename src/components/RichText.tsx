import sanitizeHtml from "sanitize-html";
import { toHtml } from "@/lib/rich";

/** Server component: turns stored content into formatted HTML, sanitizing it first. Allows everything the editor can produce. */
export default function RichText({ html, className = "" }: { html: string; className?: string }) {
  const clean = sanitizeHtml(toHtml(html), {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "h1", "h2", "h3", "ul", "ol", "li", "blockquote", "hr", "a", "img",
      "table", "thead", "tbody", "tr", "th", "td", "colgroup", "col"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading"],
      th: ["colspan", "rowspan", "colwidth"], td: ["colspan", "rowspan", "colwidth"],
      p: ["style"], h1: ["style"], h2: ["style"], h3: ["style"],
    },
    allowedStyles: { "*": { "text-align": [/^(left|center|right|justify)$/] } },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https"] },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
      img: sanitizeHtml.simpleTransform("img", { loading: "lazy" }),
      div: "p", b: "strong", i: "em",
    },
    exclusiveFilter: (f) => f.tag === "img" && !f.attribs.src,
  });
  return <div className={`rich font-telugu ${className}`} dangerouslySetInnerHTML={{ __html: clean }} />;
}
