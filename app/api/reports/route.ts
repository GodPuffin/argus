import Link from "@tiptap/extension-link";
import ListItem from "@tiptap/extension-list-item";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Underline from "@tiptap/extension-underline";
import { generateJSON } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import { marked } from "marked";
import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/reports - List all reports
export async function GET() {
  try {
    const { data: reports, error } = await supabase
      .from("reports")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching reports:", error);
      return NextResponse.json(
        { error: "Failed to fetch reports" },
        { status: 500 },
      );
    }

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error in GET /api/reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/reports - Create a new report
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title = "Untitled Report", markdown } = body;

    // Convert markdown to Tiptap JSON if provided
    let content = { type: "doc", content: [{ type: "paragraph" }] };

    if (markdown) {
      try {
        // Configure marked to preserve line breaks and use GFM
        marked.setOptions({
          breaks: true,
          gfm: true,
        });

        // Convert markdown to HTML first
        const html = await marked(markdown);

        // Convert HTML to Tiptap JSON with all extensions
        content = generateJSON(html, [
          StarterKit.configure({
            listItem: false, // We use custom ListItem
          }),
          ListItem,
          Underline,
          Link,
          TaskList,
          TaskItem,
        ]);
      } catch (err) {
        console.error("Error converting markdown:", err);
        // If conversion fails, create a simple paragraph with the markdown text
        content = {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: markdown,
                },
              ],
            },
          ],
        };
      }
    }

    const { data: report, error } = await supabase
      .from("reports")
      .insert({
        title,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating report:", error);
      return NextResponse.json(
        { error: "Failed to create report" },
        { status: 500 },
      );
    }

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/reports:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
