"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import { uploadToCloudinary } from "@/lib/cloudinary-client";
import { toHtml } from "@/lib/rich";

function Btn({
  onClick, active, title, children, disabled,
}: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`min-w-8 shrink-0 rounded-lg px-2 py-1 text-sm transition disabled:opacity-40 ${
        active ? "bg-burgundy text-gold-light" : "hover:bg-gold/20"
      }`}
    >
      {children}
    </button>
  );
}

const Sep = () => <span className="mx-1 w-px shrink-0 self-stretch bg-gold/50" />;

function Toolbar({ editor, onError }: { editor: Editor; onError: (m: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url.trim() === "") return void editor.chain().focus().extendMarkRange("link").unsetLink().run();
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(url)) return onError("Link must start with https://, mailto: or tel:");
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return onError("Please choose an image file");
    setBusy(true);
    try {
      const up = await uploadToCloudinary(file, "utsav/content");
      editor.chain().focus().setImage({ src: up.secure_url, alt: "" }).run();
    } catch (e) {
      onError((e as Error).message);
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const c = () => editor.chain().focus();

  return (
    <div className="border-b border-gold/40 bg-ivory-dark/60">
    <div className="no-scrollbar flex items-center gap-0.5 overflow-x-auto p-1.5">
      <Btn title="Bold" active={editor.isActive("bold")} onClick={() => c().toggleBold().run()}><b>B</b></Btn>
      <Btn title="Italic" active={editor.isActive("italic")} onClick={() => c().toggleItalic().run()}><i>I</i></Btn>
      <Btn title="Underline" active={editor.isActive("underline")} onClick={() => c().toggleUnderline().run()}><u>U</u></Btn>
      <Btn title="Strikethrough" active={editor.isActive("strike")} onClick={() => c().toggleStrike().run()}><s>S</s></Btn>
      <Sep />
      <Btn title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => c().toggleHeading({ level: 1 }).run()}>H1</Btn>
      <Btn title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => c().toggleHeading({ level: 2 }).run()}>H2</Btn>
      <Btn title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => c().toggleHeading({ level: 3 }).run()}>H3</Btn>
      <Sep />
      <Btn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => c().toggleBulletList().run()}>• List</Btn>
      <Btn title="Numbered list" active={editor.isActive("orderedList")} onClick={() => c().toggleOrderedList().run()}>1. List</Btn>
      <Btn title="Quote" active={editor.isActive("blockquote")} onClick={() => c().toggleBlockquote().run()}>❝</Btn>
      <Sep />
      <Btn title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => c().setTextAlign("left").run()}>⇤</Btn>
      <Btn title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => c().setTextAlign("center").run()}>↔</Btn>
      <Btn title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => c().setTextAlign("right").run()}>⇥</Btn>
      <Sep />
      <Btn title="Link" active={editor.isActive("link")} onClick={setLink}>🔗</Btn>
      <Btn title="Insert image" disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? "…" : "🖼️"}</Btn>
      <Btn title="Divider" onClick={() => c().setHorizontalRule().run()}>―</Btn>
      <Btn title="Insert table" active={editor.isActive("table")} onClick={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>▦ Table</Btn>
      <Sep />
      <Btn title="Undo" disabled={!editor.can().undo()} onClick={() => c().undo().run()}>↶</Btn>
      <Btn title="Redo" disabled={!editor.can().redo()} onClick={() => c().redo().run()}>↷</Btn>
      <Btn title="Clear formatting" onClick={() => c().unsetAllMarks().clearNodes().run()}>⌫</Btn>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => addImage(e.target.files?.[0])} />
    </div>
    {editor.isActive("table") && (
      <div className="no-scrollbar flex items-center gap-0.5 overflow-x-auto border-t border-gold/30 bg-saffron/10 p-1.5">
        <span className="shrink-0 px-1.5 text-xs font-medium text-burgundy/70">Table:</span>
        <Btn title="Add row below" onClick={() => c().addRowAfter().run()}>+ Row</Btn>
        <Btn title="Add column right" onClick={() => c().addColumnAfter().run()}>+ Col</Btn>
        <Btn title="Delete row" onClick={() => c().deleteRow().run()}>− Row</Btn>
        <Btn title="Delete column" onClick={() => c().deleteColumn().run()}>− Col</Btn>
        <Sep />
        <Btn title="Toggle header row" onClick={() => c().toggleHeaderRow().run()}>Header</Btn>
        <Btn title="Merge or split cells" onClick={() => c().mergeOrSplit().run()}>Merge/Split</Btn>
        <Sep />
        <Btn title="Delete table" onClick={() => c().deleteTable().run()}>🗑 Table</Btn>
      </div>
    )}
    </div>
  );
}

export default function RichEditor({
  value,
  onChange,
  placeholder = "Write your content here…",
  minHeight = "12rem",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}) {
  const [err, setErr] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
      Image,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: toHtml(value),
    editorProps: {
      attributes: { class: "rich px-3.5 py-3 focus:outline-none", style: `min-height:${minHeight}` },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  // Keep the editor in step with the parent's value (loading a record to edit, async settings, form reset after save).
  useEffect(() => {
    if (!editor) return;
    const incoming = toHtml(value);
    const current = editor.isEmpty ? "" : editor.getHTML();
    if (incoming !== current && !editor.isFocused) editor.commands.setContent(incoming, false);
  }, [editor, value]);

  return (
    <div className="overflow-hidden rounded-xl border border-gold/50 bg-white/80 focus-within:border-saffron focus-within:ring-2 focus-within:ring-saffron/30">
      {editor ? <Toolbar editor={editor} onError={setErr} /> : <div className="h-11 border-b border-gold/40" />}
      <EditorContent editor={editor} />
      {err && <p className="border-t border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">{err}</p>}
    </div>
  );
}
