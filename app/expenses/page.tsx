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
type BalanceRow = {
  id: string;
  name: string;
  sort_order: number;
  paid_cents: number;
  owed_cents: number;
  net_cents: number;
};
type Payment = { from: string; to: string; amount_cents: number };

function dollarsToCents(v: string) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

function centsToDollars(cents: number) {
  return (cents / 100).toFixed(2);
}

function centsToDollarsWithSign(cents: number) {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}$${(abs / 100).toFixed(2)}`;
}

function computeSettlements(rows: BalanceRow[]): Payment[] {
  const creditors = rows
    .filter((r) => r.net_cents > 0)
    .map((r) => ({ id: r.id, name: r.name, amt: r.net_cents }))
    .sort((a, b) => b.amt - a.amt);

  const debtors = rows
    .filter((r) => r.net_cents < 0)
    .map((r) => ({ id: r.id, name: r.name, amt: -r.net_cents }))
    .sort((a, b) => b.amt - a.amt);

  const payments: Payment[] = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const x = Math.min(d.amt, c.amt);
    if (x > 0) {
      payments.push({ from: d.id, to: c.id, amount_cents: x });
      d.amt -= x;
      c.amt -= x;
    }
    if (d.amt === 0) i++;
    if (c.amt === 0) j++;
  }
  return payments;
}

export default function ExpensesPage() {
  const [tab, setTab] = useState<"expenses" | "balances">("expenses");
  const [balanceTab, setBalanceTab] = useState<"summary" | "settle">("summary");
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [splits, setSplits] = useState<Split[]>([]);
  const [balances, setBalances] = useState<BalanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [included, setIncluded] = useState<Record<string, boolean>>({});
  const [share, setShare] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedExpenses, setExpandedExpenses] = useState<Set<string>>(new Set());

  async function loadAll() {
    setLoading(true);
    const [mRes, eRes, bRes] = await Promise.all([
      fetch("/api/members"),
      fetch("/api/expenses"),
      fetch("/api/balances"),
    ]);
    const mJson = await mRes.json();
    const eJson = await eRes.json();
    const bJson = await bRes.json();
    setMembers(mJson.members ?? []);
    setExpenses(eJson.expenses ?? []);
    setSplits(eJson.splits ?? []);
    setBalances(bJson.balances ?? []);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    if (members.length && !Object.keys(included).length) {
      const inc: Record<string, boolean> = {};
      const sh: Record<string, string> = {};
      for (const m of members) { inc[m.id] = false; sh[m.id] = ""; }
      setIncluded(inc);
      setShare(sh);
    }
  }, [members, included]);

  const selectedIds = useMemo(() => members.filter((m) => included[m.id]).map((m) => m.id), [members, included]);
  const shareSumCents = useMemo(() => selectedIds.reduce((sum, id) => sum + dollarsToCents(share[id] ?? "0"), 0), [selectedIds, share]);
  const totalCents = useMemo(() => dollarsToCents(amount), [amount]);

  function splitEqually() {
    if (totalCents <= 0) {
      setError("Enter an amount first.");
      return;
    }
    if (!selectedIds.length) {
      setError("Select at least one person first.");
      return;
    }
    setError(null);
    const base = Math.floor(totalCents / selectedIds.length);
    const remainder = totalCents - base * selectedIds.length;
    const next = { ...share };
    selectedIds.forEach((id, idx) => { next[id] = centsToDollars(base + (idx === 0 ? remainder : 0)); });
    setShare(next);
  }

  function handleIncludedChange(memberId: string, checked: boolean) {
    const nextIncluded = { ...included, [memberId]: checked };
    setIncluded(nextIncluded);

    // If unchecking and there's an amount, recalculate splits among remaining people
    if (!checked && totalCents > 0) {
      const remainingIds = members.filter((m) => nextIncluded[m.id]).map((m) => m.id);
      if (remainingIds.length > 0) {
        const base = Math.floor(totalCents / remainingIds.length);
        const remainder = totalCents - base * remainingIds.length;
        const nextShare = { ...share, [memberId]: "" };
        remainingIds.forEach((id, idx) => { nextShare[id] = centsToDollars(base + (idx === 0 ? remainder : 0)); });
        setShare(nextShare);
      } else {
        // No one left, clear the unchecked person's share
        setShare({ ...share, [memberId]: "" });
      }
    }
  }

  function selectAllAndSplit() {
    if (!members.length) return;
    if (totalCents <= 0) {
      setError("Enter an amount first.");
      return;
    }
    setError(null);
    const nextInc: Record<string, boolean> = {};
    for (const m of members) nextInc[m.id] = true;
    setIncluded(nextInc);
    const base = Math.floor(totalCents / members.length);
    const remainder = totalCents - base * members.length;
    const nextShare: Record<string, string> = {};
    members.forEach((m, idx) => { nextShare[m.id] = centsToDollars(base + (idx === 0 ? remainder : 0)); });
    setShare(nextShare);
  }

  function resetForm() {
    setTitle(""); setAmount(""); setNotes(""); setExpenseDate(""); setPaidBy("");
    const nextInc: Record<string, boolean> = {};
    const nextShare: Record<string, string> = {};
    for (const m of members) { nextInc[m.id] = false; nextShare[m.id] = ""; }
    setIncluded(nextInc); setShare(nextShare); setError(null);
  }

  async function submit() {
    setError(null);
    if (!title.trim()) return setError("Add a title.");
    if (!paidBy) return setError("Choose who paid.");
    if (totalCents <= 0) return setError("Enter an amount > 0.");
    if (!selectedIds.length) return setError("Select at least one person.");
    if (shareSumCents !== totalCents) return setError(`Split ($${centsToDollars(shareSumCents)}) must equal amount ($${centsToDollars(totalCents)}).`);

    setSaving(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        amount_cents: totalCents,
        paid_by: paidBy,
        notes: notes.trim() || null,
        expense_date: expenseDate || null,
        splits: selectedIds.map((id) => ({ member_id: id, share_cents: dollarsToCents(share[id] ?? "0") })),
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) return setError(json?.error ?? "Failed to save.");
    resetForm();
    setShowModal(false);
    await loadAll();
  }

  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? "Unknown";

  function toggleExpanded(id: string) {
    setExpandedExpenses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function deleteExpense(id: string) {
    if (!confirm("Delete this expense?")) return;
    const res = await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
    if (!res.ok) return setError("Failed to delete.");
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

  const payments = useMemo(() => computeSettlements(balances), [balances]);
  const nameById = useMemo(() => new Map(balances.map((r) => [r.id, r.name])), [balances]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showModal]);

  return (
    <>
      <style>{`
        .expenses-title { font-size: 28px; font-weight: 800; margin-bottom: 16px; }
        .tab-container { display: inline-flex; gap: 0; margin-bottom: 20px; }
        .tab-btn { padding: 8px 18px; font-weight: 700; font-size: 14px; border: 1px solid rgba(64,77,64,0.2); background: transparent; cursor: pointer; }
        .tab-btn:first-child { border-radius: 8px 0 0 8px; }
        .tab-btn:last-child { border-radius: 0 8px 8px 0; border-left: none; }
        .tab-btn.active { background: rgba(64,77,64,0.12); }
        .sub-tab-container { display: flex; gap: 8px; margin-bottom: 16px; }
        .sub-tab-btn { padding: 6px 14px; font-weight: 600; font-size: 12px; border: none; background: rgba(64,77,64,0.08); border-radius: 20px; cursor: pointer; color: rgba(64,77,64,0.5); }
        .sub-tab-btn.active { background: #404D40; color: #FBF6EA; }
        .add-btn { display: block; width: 100%; padding: 14px; margin-bottom: 20px; font-size: 16px; font-weight: 700; color: #FBF6EA; background: #404D40; border: none; border-radius: 12px; cursor: pointer; }
        .add-btn:hover { background: #121C19; }
        .expense-card { background-color: #FBF6EA !important; border: 1px solid rgba(64,77,64,0.18); border-radius: 14px; padding: 14px; margin-bottom: 12px; position: relative; z-index: 1; }
        .expense-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .expense-title { font-weight: 800; font-size: 16px; }
        .expense-meta { font-size: 14px; opacity: 0.8; margin-top: 4px; }
        .expense-amount { font-weight: 800; font-size: 18px; text-align: right; }
        .expense-delete { margin-top: 8px; padding: 4px 12px; font-size: 12px; color: #984636; border: 1px solid rgba(152,70,54,0.3); border-radius: 6px; background: rgba(152,70,54,0.08); cursor: pointer; }
        .splits-row { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(64,77,64,0.1); font-size: 13px; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
        .split-summary { opacity: 0.7; }
        .splits-expanded { display: flex; flex-wrap: wrap; gap: 4px; }
        .split-badge { display: inline-block; padding: 4px 10px; margin: 2px 4px 2px 0; background: rgba(64,77,64,0.08); border-radius: 20px; }
        .details-btn { padding: 4px 10px; font-size: 12px; font-weight: 600; color: #404D40; background: transparent; border: 1px solid rgba(64,77,64,0.2); border-radius: 6px; cursor: pointer; }
        .details-btn:hover { background: rgba(64,77,64,0.06); }
        .balance-card { background-color: #FBF6EA !important; border: 1px solid rgba(64,77,64,0.18); border-radius: 12px; padding: 16px; margin-bottom: 10px; position: relative; z-index: 1; }
        .balance-name { font-weight: 700; font-size: 16px; margin-bottom: 10px; }
        .balance-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .balance-stat { text-align: center; padding: 8px; background: rgba(64,77,64,0.04); border-radius: 8px; }
        .balance-stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.6; margin-bottom: 4px; }
        .balance-stat-value { font-size: 15px; font-weight: 700; }
        .balance-net-positive { color: #2d6a4f; }
        .balance-net-negative { color: #984636; }
        .balance-net-zero { opacity: 0.5; }
        .settle-card { background-color: #FBF6EA !important; border: 1px solid rgba(64,77,64,0.18); border-radius: 10px; padding: 14px 16px; margin-bottom: 8px; position: relative; z-index: 1; }
        .settle-names { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .settle-from { font-weight: 700; color: #984636; font-size: 14px; }
        .settle-to { font-weight: 700; color: #2d6a4f; font-size: 14px; text-align: right; }
        .settle-arrow { opacity: 0.4; font-size: 18px; flex-shrink: 0; margin: 0 8px; }
        .settle-amount { font-weight: 800; font-size: 18px; text-align: center; padding-top: 8px; border-top: 1px solid rgba(64,77,64,0.1); }
        .section-title { font-size: 18px; font-weight: 700; margin: 20px 0 12px 0; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 100; }
        .modal-box { background: #FBF6EA; border-radius: 16px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid rgba(64,77,64,0.15); }
        .modal-header h2 { font-size: 20px; font-weight: 800; margin: 0; }
        .modal-close { font-size: 28px; background: none; border: none; cursor: pointer; opacity: 0.5; }
        .modal-close:hover { opacity: 1; }
        .modal-body { padding: 20px; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid rgba(64,77,64,0.15); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        .form-field { display: grid; gap: 6px; }
        .form-field.full { grid-column: 1 / -1; }
        .form-field label { font-size: 13px; font-weight: 700; }
        .form-field input, .form-field select { padding: 10px 12px; border: 1px solid rgba(64,77,64,0.2); border-radius: 8px; font-size: 15px; }
        .split-section { margin-top: 16px; }
        .split-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .split-header h3 { font-size: 15px; font-weight: 700; margin: 0; }
        .split-actions { display: flex; gap: 8px; }
        .split-actions button { padding: 6px 12px; font-size: 12px; font-weight: 700; border: 1px solid rgba(64,77,64,0.2); border-radius: 6px; background: rgba(64,77,64,0.06); cursor: pointer; }
        .split-grid { display: grid; gap: 8px; }
        .split-item { display: grid; grid-template-columns: 1fr 90px; gap: 8px; align-items: center; }
        .split-check { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border: 1px solid rgba(64,77,64,0.15); border-radius: 8px; font-size: 14px; }
        .split-input { padding: 8px; border: 1px solid rgba(64,77,64,0.2); border-radius: 6px; text-align: right; }
        .split-input:disabled { opacity: 0.4; }
        .split-total { margin-top: 10px; font-size: 14px; opacity: 0.8; }
        .form-error { margin-top: 10px; color: #984636; font-weight: 600; }
        .btn-cancel { padding: 10px 20px; font-weight: 700; border: 1px solid rgba(64,77,64,0.2); border-radius: 8px; background: transparent; cursor: pointer; }
        .btn-save { padding: 10px 20px; font-weight: 700; color: #FBF6EA; background: #404D40; border: none; border-radius: 8px; cursor: pointer; }
        .btn-save:disabled { opacity: 0.5; }
        @media (max-width: 500px) {
          .form-row { grid-template-columns: 1fr; }
          .balance-stats { flex-direction: column; gap: 4px; }
        }
      `}</style>

      <h1 className="expenses-title">Expenses</h1>

      <div className="tab-container">
        <button className={`tab-btn ${tab === "expenses" ? "active" : ""}`} onClick={() => setTab("expenses")}>Expenses</button>
        <button className={`tab-btn ${tab === "balances" ? "active" : ""}`} onClick={() => setTab("balances")}>Balances</button>
      </div>

      {loading ? <div>Loading…</div> : tab === "expenses" ? (
        <>
          <button className="add-btn" onClick={() => setShowModal(true)}>+ Add Expense</button>

          {expenses.length === 0 ? <div style={{ opacity: 0.7 }}>No expenses yet.</div> : (
            [...expenses].sort((a, b) => b.amount_cents - a.amount_cents).map((e) => {
              const s = (splitsByExpense.get(e.id) ?? []).sort((a, b) => a.share_cents - b.share_cents);
              const isExpanded = expandedExpenses.has(e.id);
              return (
                <div key={e.id} className="expense-card">
                  <div className="expense-row">
                    <div>
                      <div className="expense-title">{e.title}</div>
                      <div className="expense-meta">
                        Paid by <b>{memberName(e.paid_by)}</b>
                        {e.expense_date ? ` • ${e.expense_date}` : ""}
                      </div>
                      {e.notes && <div className="expense-meta">{e.notes}</div>}
                    </div>
                    <div>
                      <div className="expense-amount">${centsToDollars(e.amount_cents)}</div>
                      <button className="expense-delete" onClick={() => deleteExpense(e.id)}>Delete</button>
                    </div>
                  </div>
                  {s.length > 0 && (
                    <div className="splits-row">
                      {isExpanded ? (
                        <>
                          <div className="splits-expanded">
                            {s.map((x) => (
                              <span key={x.member_id} className="split-badge">{memberName(x.member_id)} ${centsToDollars(x.share_cents)}</span>
                            ))}
                          </div>
                          <button className="details-btn" onClick={() => toggleExpanded(e.id)}>Hide details</button>
                        </>
                      ) : (
                        <>
                          <span className="split-summary">Split between {s.length} {s.length === 1 ? "person" : "people"}</span>
                          <button className="details-btn" onClick={() => toggleExpanded(e.id)}>See details</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </>
      ) : (
        <>
          <div className="sub-tab-container">
            <button className={`sub-tab-btn ${balanceTab === "summary" ? "active" : ""}`} onClick={() => setBalanceTab("summary")}>Summary</button>
            <button className={`sub-tab-btn ${balanceTab === "settle" ? "active" : ""}`} onClick={() => setBalanceTab("settle")}>Settle Up</button>
          </div>

          {balanceTab === "summary" ? (
            <>
              {[...balances].sort((a, b) => b.net_cents - a.net_cents).map((r) => (
                <div key={r.id} className="balance-card">
                  <div className="balance-name">{r.name}</div>
                  <div className="balance-stats">
                    <div className="balance-stat">
                      <div className="balance-stat-label">Paid</div>
                      <div className="balance-stat-value">${centsToDollars(r.paid_cents)}</div>
                    </div>
                    <div className="balance-stat">
                      <div className="balance-stat-label">Share</div>
                      <div className="balance-stat-value">${centsToDollars(r.owed_cents)}</div>
                    </div>
                    <div className="balance-stat">
                      <div className="balance-stat-label">Net</div>
                      <div className={`balance-stat-value ${r.net_cents > 0 ? "balance-net-positive" : r.net_cents < 0 ? "balance-net-negative" : "balance-net-zero"}`}>
                        {centsToDollarsWithSign(r.net_cents)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {payments.length === 0 ? <div style={{ opacity: 0.7 }}>Everyone is even!</div> : (
                payments.map((p, idx) => (
                  <div key={idx} className="settle-card">
                    <div className="settle-names">
                      <span className="settle-from">{nameById.get(p.from)}</span>
                      <span className="settle-arrow">→</span>
                      <span className="settle-to">{nameById.get(p.to)}</span>
                    </div>
                    <div className="settle-amount">${centsToDollars(p.amount_cents)}</div>
                  </div>
                ))
              )}
            </>
          )}
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Expense</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-field">
                  <label>Title</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="form-field">
                  <label>Amount ($)</label>
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Paid by</label>
                  <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
                    <option value="">Select person</option>
                    {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Date (optional)</label>
                  <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field full">
                  <label>Notes (optional)</label>
                  <input value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>

              <div className="split-section">
                <div className="split-header">
                  <h3>Split between</h3>
                  <div className="split-actions">
                    <button type="button" onClick={selectAllAndSplit}>All & split</button>
                    {selectedIds.length > 0 && <button type="button" onClick={splitEqually}>Split equally</button>}
                  </div>
                </div>
                <div className="split-grid">
                  {members.map((m) => (
                    <div key={m.id} className="split-item">
                      <label className="split-check">
                        <input type="checkbox" checked={!!included[m.id]} onChange={(e) => handleIncludedChange(m.id, e.target.checked)} />
                        {m.name}
                      </label>
                      <input
                        className="split-input"
                        disabled={!included[m.id]}
                        value={share[m.id] ?? ""}
                        onChange={(e) => setShare({ ...share, [m.id]: e.target.value })}
                        placeholder="0.00"
                        inputMode="decimal"
                      />
                    </div>
                  ))}
                </div>
                <div className="split-total">
                  Split: <b>${centsToDollars(shareSumCents)}</b> / Total: <b>${centsToDollars(totalCents)}</b>
                </div>
              </div>

              {error && <div className="form-error">{error}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => { resetForm(); setShowModal(false); }}>Cancel</button>
              <button className="btn-save" onClick={submit} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
