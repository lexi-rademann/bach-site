import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type CreateGroceryBody = {
  label: string;
  qty?: string | null;
  notes?: string | null;
  category?: string;

};

type UpdateGroceryBody = {
  label?: string;
  qty?: string | null;
  notes?: string | null;
  claimed_by?: string | null; // member_id or null
  category?: string | null; 
};

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("grocery_items")
    .select("id,label,qty,notes,claimed_by,category,created_at,claimed_at") // Add created_at and claimed_at
    .order("category", { ascending: true }) // Order by category first
    .order("claimed_by", { ascending: true, nullsFirst: true }) // Then unclaimed first
    .order("created_at", { ascending: false }); // Then newest first
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, items: data });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as CreateGroceryBody | null;
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  const label = (body.label ?? "").trim();
  if (!label) return NextResponse.json({ ok: false, error: "Item name required" }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from("grocery_items")
    .insert({
      label,
      qty: body.qty?.trim() || null,
      notes: body.notes?.trim() || null,
      category: body.category || "snacks", // Add this line with a default
    })
    .select("id,label,qty,notes,claimed_by,category") // Add category to select
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, item: data });
}

// PATCH supports updates (claim/unclaim/edit fields)
export async function PATCH(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

  const body = (await req.json().catch(() => null)) as UpdateGroceryBody | null;
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });

  const update: Record<string, any> = {};
  if (typeof body.label === "string") update.label = body.label.trim();
  if (body.qty !== undefined) update.qty = body.qty?.trim() || null;
  if (body.notes !== undefined) update.notes = body.notes?.trim() || null;
  if (body.claimed_by !== undefined) update.claimed_by = body.claimed_by || null;
  if (body.category !== undefined) update.category = body.category || null;

  const { data, error } = await supabaseAdmin
    .from("grocery_items")
    .update(update)
    .eq("id", id)
    .select("id,label,qty,notes,claimed_by,category")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, item: data });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

  const { error } = await supabaseAdmin.from("grocery_items").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
