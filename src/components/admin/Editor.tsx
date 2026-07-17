"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  ImagePlus,
  Link2,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";
import { cx } from "@/lib/utils";

export function Editor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({
        placeholder: placeholder || "Start writing…",
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose-editorial min-h-[380px] focus:outline-none",
      },
    },
  });

  // Keep editor content in sync when value is replaced externally (AI actions).
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  const Btn = ({
    onClick,
    active,
    label,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    label: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cx(
        "inline-flex h-8 w-8 items-center justify-center rounded transition",
        active ? "bg-foreground text-background" : "text-muted hover:bg-subtle"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-lg border border-line bg-card">
      <div className="flex flex-wrap items-center gap-1 border-b border-line p-2">
        <Btn
          label="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          <Bold size={16} />
        </Btn>
        <Btn
          label="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          <Italic size={16} />
        </Btn>
        <Btn
          label="Heading 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
        >
          <Heading2 size={16} />
        </Btn>
        <Btn
          label="Heading 3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
        >
          <Heading3 size={16} />
        </Btn>
        <Btn
          label="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          <List size={16} />
        </Btn>
        <Btn
          label="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          <ListOrdered size={16} />
        </Btn>
        <Btn
          label="Quote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        >
          <Quote size={16} />
        </Btn>
        <Btn
          label="Insert image"
          onClick={() => {
            const url = window.prompt("Image URL");
            if (!url) return;
            const credit = window.prompt("Image credit / caption (optional)") || "";
            editor.chain().focus().setImage({ src: url, alt: credit }).run();
            if (credit) {
              editor
                .chain()
                .focus()
                .insertContent(`<p><em>${credit}</em></p>`)
                .run();
            }
          }}
        >
          <ImagePlus size={16} />
        </Btn>
        <Btn
          label="Link"
          onClick={() => {
            const url = window.prompt("Link URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
            else editor.chain().focus().unsetLink().run();
          }}
          active={editor.isActive("link")}
        >
          <Link2 size={16} />
        </Btn>
      </div>
      <div className="p-5">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
