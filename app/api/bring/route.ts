import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type CreateBody = { label: string; notes?: string | null };
type UpdateBody = { label?: string; notes?: string | null; assigned_to?: string | null };

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("bring_items")
    .select("id,label,notes,assigned_to")
    .order("label", { ascending: true });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, items: data });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as CreateBody | null;
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });

  const label = (body.label ?? "").trim();
  if (!label) return NextResponse.json({ ok: false, error: "Item name required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("bring_items")
    .insert({ label, notes: body.notes?.trim() || null })
    .select("id,label,notes,assigned_to")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, item: data });
}

export async function PATCH(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

  const body = (await req.json().catch(() => null)) as UpdateBody | null;
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });

  const update: Record<string, any> = {};
  if (typeof body.label === "string") update.label = body.label.trim();
  if (body.notes !== undefined) update.notes = body.notes?.trim() || null;
  if (body.assigned_to !== undefined) update.assigned_to = body.assigned_to || null;

  const { data, error } = await supabaseAdmin
    .from("bring_items")
    .update(update)
    .eq("id", id)
    .select("id,label,notes,assigned_to")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, item: data });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

  const { error } = await supabaseAdmin.from("bring_items").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
