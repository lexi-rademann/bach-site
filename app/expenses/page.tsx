"use client";

import { useEffect, useMemo, useState } from "react";

type Member = { id: string; name: string; sort_order: number };
type Expense = {
  id: string;
  created_at: string;
  title: string;
  amount_cents: number;
  paid_by: string;
  category: string | null;
  notes: string | null;
  expense_date: string | null;
};
type Split = { expense_id: string; member_id: string; share_cents: number };

function dollarsToCents(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}
function centsToDollars(cents: number) {
  return (cents / 100).toFixed(2);
}

export default function ExpensesPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [splits, setSplits] = useState<Split[]>([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("");

  const [included, setIncluded] = useState<Record<string, boolean>>({});
  const [share, setShare] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError(null);

    const mRes = await fetch("/api/members");
    const mJson = await mRes.json();
    setMembers(mJson.members ?? []);

    const eRes = await fetch("/api/expenses");
    const eJson = await eRes.json();
    setExpenses(eJson.expenses ?? []);
    setSplits(eJson.splits ?? []);

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    // initialize form defaults once members exist
    if (members.length && !Object.keys(included).length) {
      const inc: Record<string, boolean> = {};
      const sh: Record<string, string> = {};
      for (const m of members) {
        inc[m.id] = false;
        sh[m.id] = "";
      }
      setIncluded(inc);
      setShare(sh);
    }
  }, [members, included]);

  const selectedIds = useMemo(
    () => members.filter((m) => included[m.id]).map((m) => m.id),
    [members, included]
  );

  const shareSumCents = useMemo(() => {
    let sum = 0;
    for (const id of selectedIds) sum += dollarsToCents(share[id] ?? "0");
    return sum;
  }, [selectedIds, share]);

  const totalCents = useMemo(() => dollarsToCents(amount), [amount]);

  function splitEqually() {
    if (!selectedIds.length) return;
    const total = totalCents;
    if (total <= 0) return;

    const base = Math.floor(total / selectedIds.length);
    const remainder = total - base * selectedIds.length;

    const next = { ...share };
    selectedIds.forEach((id, idx) => {
      const cents = base + (idx === 0 ? remainder : 0);
      next[id] = centsToDollars(cents);
    });
    setShare(next);
  }

  function selectAllAndSplit() {
    if (!members.length) return;
    const total = totalCents;
    if (total <= 0) return;

    // Select all members
    const nextInc: Record<string, boolean> = {};
    for (const m of members) {
      nextInc[m.id] = true;
    }
    setIncluded(nextInc);

    // Split equally among all
    const base = Math.floor(total / members.length);
    const remainder = total - base * members.length;

    const nextShare: Record<string, string> = {};
    members.forEach((m, idx) => {
      const cents = base + (idx === 0 ? remainder : 0);
      nextShare[m.id] = centsToDollars(cents);
    });
    setShare(nextShare);
  }

  async function submit() {
    setError(null);

    if (!title.trim()) return setError("Add a title.");
    if (!paidBy) return setError("Choose who paid.");
    if (totalCents <= 0) return setError("Enter an amount > 0.");
    if (!selectedIds.length) return setError("Select at least one attendee to split with.");

    if (shareSumCents !== totalCents) {
      return setError(`Split total ($${centsToDollars(shareSumCents)}) must equal amount ($${centsToDollars(totalCents)}).`);
    }

    const payload = {
      title: title.trim(),
      amount_cents: totalCents,
      paid_by: paidBy,
      category: category.trim() || null,
      notes: notes.trim() || null,
      expense_date: expenseDate || null,
      splits: selectedIds.map((id) => ({
        member_id: id,
        share_cents: dollarsToCents(share[id] ?? "0"),
      })),
    };

    setSaving(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(json?.error ?? "Failed to save expense.");
      return;
    }

    // reset form
    setTitle("");
    setAmount("");
    setNotes("");
    setCategory("");
    setExpenseDate("");
    const nextInc = { ...included };
    const nextShare = { ...share };
    for (const m of members) {
      nextInc[m.id] = false;
      nextShare[m.id] = "";
    }
    setIncluded(nextInc);
    setShare(nextShare);

    await loadAll();
  }

  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? "Unknown";

  async function deleteExpense(id: string) {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    const res = await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
    const json = await res.json();

    if (!res.ok) {
      setError(json?.error ?? "Failed to delete expense.");
      return;
    }

    await loadAll();
  }

  const splitsByExpense = useMemo(() => {
    const map = new Map<string, Split[]>();
    for (const s of splits) {
      const arr = map.get(s.expense_id) ?? [];
      arr.push(s);
      map.set(s.expense_id, arr);
    }
    return map;
  }, [splits]);

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Expenses</h1>

      <section style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Add an expense</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
            <span style={{ fontWeight: 600 }}>Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", minWidth: 0, padding: 10, border: "1px solid #ddd", borderRadius: 10, boxSizing: "border-box" }} />
          </label>

          <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
            <span style={{ fontWeight: 600 }}>Amount ($)</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" style={{ width: "100%", minWidth: 0, padding: 10, border: "1px solid #ddd", borderRadius: 10, boxSizing: "border-box" }} />
          </label>

          <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
            <span style={{ fontWeight: 600 }}>Paid by</span>
            <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} style={{ width: "100%", minWidth: 0, padding: 10, border: "1px solid #ddd", borderRadius: 10, boxSizing: "border-box" }}>
              <option value="">Select a person</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
            <span style={{ fontWeight: 600 }}>Date (optional)</span>
            <input value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} type="date" style={{ width: "100%", minWidth: 0, padding: 10, border: "1px solid #ddd", borderRadius: 10, boxSizing: "border-box" }} />
          </label>

          <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
            <span style={{ fontWeight: 600 }}>Category (optional)</span>
            <input value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%", minWidth: 0, padding: 10, border: "1px solid #ddd", borderRadius: 10, boxSizing: "border-box" }} />
          </label>

          <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
            <span style={{ fontWeight: 600 }}>Notes (optional)</span>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: "100%", minWidth: 0, padding: 10, border: "1px solid #ddd", borderRadius: 10, boxSizing: "border-box" }} />
          </label>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Custom splits</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={selectAllAndSplit} style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}>
                Select all & split equally
              </button>
              <button onClick={splitEqually} style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}>
                Split equally
              </button>
            </div>
          </div>

          <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 140px", gap: 8 }}>
            {members.map((m) => (
              <div key={m.id} style={{ display: "contents" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, padding: 8, border: "1px solid #eee", borderRadius: 10 }}>
                  <input
                    type="checkbox"
                    checked={!!included[m.id]}
                    onChange={(e) => setIncluded({ ...included, [m.id]: e.target.checked })}
                  />
                  {m.name}
                </label>
                <input
                  disabled={!included[m.id]}
                  value={share[m.id] ?? ""}
                  onChange={(e) => setShare({ ...share, [m.id]: e.target.value })}
                  placeholder="0.00"
                  inputMode="decimal"
                  style={{ padding: 8, border: "1px solid #ddd", borderRadius: 10, opacity: included[m.id] ? 1 : 0.5 }}
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 10, opacity: 0.85 }}>
            Split total: <b>${centsToDollars(shareSumCents)}</b> / Amount: <b>${centsToDollars(totalCents)}</b>
          </div>

          {error && <div style={{ color: "crimson", marginTop: 10 }}>{error}</div>}

          <button
            onClick={submit}
            disabled={saving}
            style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}
          >
            {saving ? "Saving..." : "Save expense"}
          </button>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>All expenses</h2>

        {loading ? (
          <div>Loading…</div>
        ) : expenses.length === 0 ? (
          <div>No expenses yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {expenses.map((e) => {
              const s = (splitsByExpense.get(e.id) ?? []).slice().sort((a, b) => memberName(a.member_id).localeCompare(memberName(b.member_id)));
              return (
                <div key={e.id} style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{e.title}</div>
                      <div style={{ opacity: 0.8 }}>
                        Paid by <b>{memberName(e.paid_by)}</b>{e.expense_date ? ` • ${e.expense_date}` : ""}
                        {e.category ? ` • ${e.category}` : ""}
                      </div>
                      {e.notes ? <div style={{ marginTop: 6, opacity: 0.8 }}>{e.notes}</div> : null}
                    </div>
                    <div style={{ display: "flex", alignItems: "start", gap: 12 }}>
                      <div style={{ fontWeight: 800 }}>${centsToDollars(e.amount_cents)}</div>
                      <button
                        onClick={() => deleteExpense(e.id)}
                        style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid #ddd", cursor: "pointer", color: "crimson", fontSize: 13 }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {s.length ? (
                    <div style={{ marginTop: 10, opacity: 0.9 }}>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>Splits</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 6 }}>
                        {s.map((x) => (
                          <div key={x.member_id} style={{ display: "contents" }}>
                            <div>{memberName(x.member_id)}</div>
                            <div style={{ textAlign: "right" }}>${centsToDollars(x.share_cents)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
    