"use client";

import { useEffect, useMemo, useState } from "react";

type BalanceRow = {
  id: string;
  name: string;
  sort_order: number;
  paid_cents: number;
  owed_cents: number;
  net_cents: number; // + = they are owed, - = they owe
};

function centsToDollars(cents: number) {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}$${(abs / 100).toFixed(2)}`;
}

type Payment = { from: string; to: string; amount_cents: number };

function computeSettlements(rows: BalanceRow[]): Payment[] {
  // creditors: net > 0, debtors: net < 0
  const creditors = rows
    .filter((r) => r.net_cents > 0)
    .map((r) => ({ id: r.id, name: r.name, amt: r.net_cents }))
    .sort((a, b) => b.amt - a.amt);

  const debtors = rows
    .filter((r) => r.net_cents < 0)
    .map((r) => ({ id: r.id, name: r.name, amt: -r.net_cents })) // make positive "owes"
    .sort((a, b) => b.amt - a.amt);

  const payments: Payment[] = [];
  let i = 0;
  let j = 0;

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

export default function BalancesPage() {
  const [rows, setRows] = useState<BalanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/balances");
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json?.error ?? "Failed to load balances");
      return;
    }

    setRows(json.balances ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  const payments = useMemo(() => computeSettlements(rows), [rows]);
  const nameById = useMemo(() => new Map(rows.map((r) => [r.id, r.name])), [rows]);

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Balances</h1>

      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div style={{ color: "crimson" }}>{error}</div>
      ) : (
        <>
          <section style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16, background: "#FBF6EA" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Summary</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px 140px", gap: 8, fontWeight: 700 }}>
              <div>Person</div>
              <div style={{ textAlign: "right" }}>Paid</div>
              <div style={{ textAlign: "right" }}>Owes</div>
              <div style={{ textAlign: "right" }}>Net</div>
            </div>

            <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
              {rows.map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 140px 140px 140px",
                    gap: 8,
                    padding: "8px 10px",
                    border: "1px solid #f0f0f0",
                    borderRadius: 10,
                    background: "#FFFFFF",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{r.name}</div>
                  <div style={{ textAlign: "right" }}>{centsToDollars(r.paid_cents)}</div>
                  <div style={{ textAlign: "right" }}>{centsToDollars(r.owed_cents)}</div>
                  <div style={{ textAlign: "right", fontWeight: 800 }}>
                    <span style={{ color: r.net_cents < 0 ? "crimson" : r.net_cents > 0 ? "green" : "inherit" }}>
                      {centsToDollars(r.net_cents)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ marginTop: 16, border: "1px solid #e5e5e5", borderRadius: 12, padding: 16, background: "#FBF6EA" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Suggested settle up</h2>

            {payments.length === 0 ? (
              <div>No payments needed (everyone is even).</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {payments.map((p, idx) => (
                  <div key={idx} style={{ padding: "8px 10px", border: "1px solid #f0f0f0", borderRadius: 10, background: "#FFFFFF" }}>
                    <b>{nameById.get(p.from) ?? "Someone"}</b> pays{" "}
                    <b>{nameById.get(p.to) ?? "Someone"}</b>{" "}
                    <b>{centsToDollars(p.amount_cents)}</b>
                  </div>
                ))}
              </div>
            )}
          </section>

          <button
            onClick={load}
            style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}
          >
            Refresh
          </button>
        </>
      )}
    </main>
  );
}
