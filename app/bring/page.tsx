"use client";

import { useEffect, useMemo, useState } from "react";

type Member = { id: string; name: string; sort_order: number };
type BringItem = { id: string; label: string; notes: string | null; assigned_to: string | null };

export default function BringPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [items, setItems] = useState<BringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // add form
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);

    const mRes = await fetch("/api/members");
    const mJson = await mRes.json();
    setMembers(mJson.members ?? []);

    const r = await fetch("/api/bring");
    const j = await r.json();

    if (!r.ok) {
      setError(j?.error ?? "Failed to load bring list");
      setLoading(false);
      return;
    }

    setItems(j.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const nameById = useMemo(() => new Map(members.map((m) => [m.id, m.name])), [members]);

  async function addItem() {
    setError(null);
    const t = label.trim();
    if (!t) return setError("Add an item name.");

    setSaving(true);
    const res = await fetch("/api/bring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: t, notes: notes.trim() || null }),
    });
    const json = await res.json();
    setSaving(false);

    if (!res.ok) return setError(json?.error ?? "Failed to add item");

    setLabel("");
    setNotes("");
    await load();
  }

  async function updateItem(id: string, patch: Partial<BringItem>) {
    setError(null);
    const res = await fetch(`/api/bring?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = await res.json();

    if (!res.ok) return setError(json?.error ?? "Failed to update item");

    setItems((prev) => prev.map((x) => (x.id === id ? json.item : x)));
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this item?")) return;

    setError(null);
    const res = await fetch(`/api/bring?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const json = await res.json();

    if (!res.ok) return setError(json?.error ?? "Failed to delete item");

    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  const unassigned = items.filter((i) => !i.assigned_to);
  const assigned = items.filter((i) => !!i.assigned_to);

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <style>{`
        .bring-item-grid {
          display: grid;
          grid-template-columns: 2fr 3fr 220px auto;
          gap: 10px;
          align-items: center;
        }
        .bring-form-grid {
          display: grid;
          grid-template-columns: 2fr 3fr auto;
          gap: 10px;
          align-items: end;
        }
        .bring-form-grid label {
          min-width: 0;
          display: grid;
          gap: 4px;
        }
        .bring-form-grid input {
          min-width: 0;
          box-sizing: border-box;
        }
        .bring-form-grid button {
          white-space: nowrap;
        }
        @media (max-width: 880px) {
          .bring-item-grid {
            grid-template-columns: 1fr;
          }
          .bring-form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>What to Bring</h1>

      <section style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16, marginBottom: 18 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Add an item</h2>

        <div className="bring-form-grid">
          <label>
            Item
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Speaker"
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            />
          </label>

          <label>
            Notes (optional)
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bluetooth preferred"
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            />
          </label>

          <button onClick={addItem} disabled={saving} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}>
            {saving ? "Adding…" : "Add"}
          </button>
        </div>

        {error && <div style={{ color: "crimson", marginTop: 10 }}>{error}</div>}
      </section>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <>
          <BringSection
            title={`Unassigned (${unassigned.length})`}
            items={unassigned}
            members={members}
            nameById={nameById}
            onAssign={(id, memberId) => updateItem(id, { assigned_to: memberId || null })}
            onEdit={(id, patch) => updateItem(id, patch)}
            onDelete={deleteItem}
          />

          <div style={{ height: 14 }} />

          <BringSection
            title={`Assigned (${assigned.length})`}
            items={assigned}
            members={members}
            nameById={nameById}
            onAssign={(id, memberId) => updateItem(id, { assigned_to: memberId || null })}
            onEdit={(id, patch) => updateItem(id, patch)}
            onDelete={deleteItem}
          />

          <button onClick={load} style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}>
            Refresh
          </button>
        </>
      )}
    </main>
  );
}

function BringSection({
  title,
  items,
  members,
  nameById,
  onAssign,
  onEdit,
  onDelete,
}: {
  title: string;
  items: BringItem[];
  members: Member[];
  nameById: Map<string, string>;
  onAssign: (id: string, memberId: string) => void;
  onEdit: (id: string, patch: Partial<BringItem>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{title}</h2>

      {items.length === 0 ? (
        <div style={{ opacity: 0.8 }}>No items.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((i) => (
            <div key={i.id} style={{ border: "1px solid #f0f0f0", borderRadius: 12, padding: 12 }}>
              <div className="bring-item-grid">
                <div style={{ minWidth: 0 }}>
                  <EditableText value={i.label} placeholder="Item" onSave={(v) => onEdit(i.id, { label: v })} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <EditableText value={i.notes ?? ""} placeholder="Notes" onSave={(v) => onEdit(i.id, { notes: v || null })} />
                </div>

                <label style={{ display: "grid", gap: 4, minWidth: 0 }}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Assigned to</span>
                  <select
                    value={i.assigned_to ?? ""}
                    onChange={(e) => onAssign(i.id, e.target.value)}
                    style={{ width: "100%", minWidth: 0, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </label>

                <button onClick={() => onDelete(i.id)} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer", whiteSpace: "nowrap" }}>
                  Delete
                </button>
              </div>

              {i.assigned_to ? (
                <div style={{ marginTop: 8, opacity: 0.85 }}>
                  Assigned to <b>{nameById.get(i.assigned_to) ?? "Someone"}</b>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EditableText({ value, placeholder, onSave }: { value: string; placeholder: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setV(value);
    setDirty(false);
  }, [value]);

  return (
    <label style={{ display: "grid", gap: 4, minWidth: 0 }}>
      <span style={{ fontSize: 12, opacity: 0.8 }}>{placeholder}</span>
      <input
        value={v}
        onChange={(e) => {
          setV(e.target.value);
          setDirty(true);
        }}
        onBlur={() => {
          if (dirty) onSave(v.trim());
        }}
        style={{ width: "100%", minWidth: 0, padding: 10, borderRadius: 10, border: "1px solid #ddd", boxSizing: "border-box" }}
      />
    </label>
  );
}
