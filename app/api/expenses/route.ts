import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type CreateExpenseBody = {
  title: string;
  amount_cents: number;
  paid_by: string;
  category?: string | null;
  notes?: string | null;
  expense_date?: string | null; // YYYY-MM-DD
  splits: { member_id: string; share_cents: number }[];
};

export async function GET() {
  // 1) Get expenses
  const { data: expenses, error: eErr } = await supabaseAdmin
    .from("expenses")
    .select("id,created_at,title,amount_cents,paid_by,category,notes,expense_date")
    .order("created_at", { ascending: false });

  if (eErr) return NextResponse.json({ ok: false, error: eErr.message }, { status: 500 });

  // 2) Get splits for those expenses
  const ids = (expenses ?? []).map((e) => e.id);
  const { data: splits, error: sErr } = await supabaseAdmin
    .from("expense_splits")
    .select("expense_id,member_id,share_cents")
    .in("expense_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

  if (sErr) return NextResponse.json({ ok: false, error: sErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, expenses, splits });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as CreateExpenseBody | null;
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });

  const title = (body.title ?? "").trim();
  if (!title) return NextResponse.json({ ok: false, error: "Title required" }, { status: 400 });
  if (!body.paid_by) return NextResponse.json({ ok: false, error: "Paid by required" }, { status: 400 });
  if (!Number.isInteger(body.amount_cents) || body.amount_cents <= 0)
    return NextResponse.json({ ok: false, error: "Amount must be > 0" }, { status: 400 });
  if (!Array.isArray(body.splits) || body.splits.length === 0)
    return NextResponse.json({ ok: false, error: "At least one split required" }, { status: 400 });

  // Call the RPC we created in Supabase
  const { data, error } = await supabaseAdmin.rpc("create_expense_with_splits", {
    p_title: title,
    p_amount_cents: body.amount_cents,
    p_paid_by: body.paid_by,
    p_category: body.category ?? null,
    p_notes: body.notes ?? null,
    p_expense_date: body.expense_date ?? null,
    p_splits: body.splits,
  });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, expense_id: data });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ ok: false, error: "Missing expense id" }, { status: 400 });

  // Delete splits first (foreign key constraint)
  const { error: splitsErr } = await supabaseAdmin
    .from("expense_splits")
    .delete()
    .eq("expense_id", id);

  if (splitsErr) return NextResponse.json({ ok: false, error: splitsErr.message }, { status: 500 });

  // Delete the expense
  const { error: expenseErr } = await supabaseAdmin
    .from("expenses")
    .delete()
    .eq("id", id);

  if (expenseErr) return NextResponse.json({ ok: false, error: expenseErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
