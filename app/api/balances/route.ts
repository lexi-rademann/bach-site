import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const { data: members, error: mErr } = await supabaseAdmin
    .from("members")
    .select("id,name,sort_order")
    .order("sort_order", { ascending: true });

  if (mErr) return NextResponse.json({ ok: false, error: mErr.message }, { status: 500 });

  const { data: expenses, error: eErr } = await supabaseAdmin
    .from("expenses")
    .select("id,amount_cents,paid_by");

  if (eErr) return NextResponse.json({ ok: false, error: eErr.message }, { status: 500 });

  const { data: splits, error: sErr } = await supabaseAdmin
    .from("expense_splits")
    .select("expense_id,member_id,share_cents");

  if (sErr) return NextResponse.json({ ok: false, error: sErr.message }, { status: 500 });

  const paidBy = new Map<string, number>();
  for (const e of expenses ?? []) {
    paidBy.set(e.paid_by, (paidBy.get(e.paid_by) ?? 0) + e.amount_cents);
  }

  const owedBy = new Map<string, number>();
  for (const s of splits ?? []) {
    owedBy.set(s.member_id, (owedBy.get(s.member_id) ?? 0) + s.share_cents);
  }

  const rows = (members ?? []).map((m) => {
    const paid = paidBy.get(m.id) ?? 0;
    const owed = owedBy.get(m.id) ?? 0;
    const net = paid - owed; // + = they are owed, - = they owe
    return { ...m, paid_cents: paid, owed_cents: owed, net_cents: net };
  });

  return NextResponse.json({ ok: true, balances: rows });
}
