import { type NextRequest, NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo/flag";
import { demoReportStore } from "@/lib/demo/mock-data";
import { supabase } from "@/lib/supabase";

// GET /api/reports/[id] - Get a specific report
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (isDemoMode) {
      const report = demoReportStore().find((r) => r.id === id);
      if (!report) {
        return NextResponse.json(
          { error: "Report not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ report });
    }

    const { data: report, error } = await supabase
      .from("reports")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching report:", error);
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Error in GET /api/reports/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/reports/[id] - Update a report
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, content } = body;

    if (isDemoMode) {
      const store = demoReportStore();
      const idx = store.findIndex((r) => r.id === id);
      if (idx < 0) {
        return NextResponse.json(
          { error: "Report not found" },
          { status: 404 },
        );
      }
      const updated = {
        ...store[idx],
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {}),
        updated_at: new Date().toISOString(),
      };
      store[idx] = updated;
      return NextResponse.json({ report: updated });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;

    const { data: report, error } = await supabase
      .from("reports")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating report:", error);
      return NextResponse.json(
        { error: "Failed to update report" },
        { status: 500 },
      );
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Error in PATCH /api/reports/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/reports/[id] - Delete a report
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (isDemoMode) {
      const store = demoReportStore();
      const idx = store.findIndex((r) => r.id === id);
      if (idx >= 0) store.splice(idx, 1);
      return NextResponse.json({ success: true });
    }

    const { error } = await supabase.from("reports").delete().eq("id", id);

    if (error) {
      console.error("Error deleting report:", error);
      return NextResponse.json(
        { error: "Failed to delete report" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/reports/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
