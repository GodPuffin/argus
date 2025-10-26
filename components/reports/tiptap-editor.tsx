"use client";

import Link from "@tiptap/extension-link";
import ListItem from "@tiptap/extension-list-item";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { EditorToolbar } from "./editor-toolbar";

interface TiptapEditorProps {
  content: any;
  onUpdate?: (content: any) => void;
  editable?: boolean;
  className?: string;
}

export function TiptapEditor({
  content,
  onUpdate,
  editable = true,
  className,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable the default list item from StarterKit to use custom TaskItem
        listItem: false,
      }),
      ListItem,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "flex items-start gap-2",
        },
      }),
    ],
    content,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn("focus:outline-none min-h-[500px] px-4 py-3", className),
      },
    },
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.getJSON());
      }
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (
      editor &&
      content &&
      JSON.stringify(editor.getJSON()) !== JSON.stringify(content)
    ) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="w-full rounded-lg border bg-background">
      {editable && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
