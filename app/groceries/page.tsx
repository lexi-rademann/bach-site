"use client";

import { useEffect, useState } from "react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Member = { id: string; name: string; sort_order: number };
type GroceryItem = {
  id: string;
  label: string;
  qty: string | null;
  notes: string | null;
  claimed_by: string | null;
  claimed_at: string | null;
  created_at: string;
};

export default function GroceriesPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [filter, setFilter] = useState<"unclaimed" | "claimed" | "all">("unclaimed");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add form state
  const [newLabel, setNewLabel] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [adding, setAdding] = useState(false);

  // Edit state: track which row is being edited
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editClaimedBy, setEditClaimedBy] = useState("");

  async function loadData() {
    setLoading(true);
    setError(null);

    const { data: membersData, error: mErr } = await supabaseAdmin
      .from("members")
      .select("id, name, sort_order")
      .order("sort_order", { ascending: true });

    if (mErr) {
      setError(mErr.message);
      setLoading(false);
      return;
    }
    setMembers(membersData ?? []);

    const { data: itemsData, error: iErr } = await supabaseAdmin
      .from("grocery_items")
      .select("id, label, qty, notes, claimed_by, claimed_at, created_at")
      .order("claimed_by", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: false });

    if (iErr) {
      setError(iErr.message);
      setLoading(false);
      return;
    }

    setItems(itemsData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = items.filter((item) => {
    if (filter === "unclaimed") return !item.claimed_by;
    if (filter === "claimed") return !!item.claimed_by;
    return true;
  });

  async function addItem() {
    if (!newLabel.trim()) {
      setError("Item name is required");
      return;
    }
    setAdding(true);
    setError(null);

    const { error: addErr } = await supabaseAdmin.from("grocery_items").insert({
      label: newLabel.trim(),
      qty: newQty.trim() || null,
      notes: newNotes.trim() || null,
    });

    setAdding(false);
    if (addErr) {
      setError(addErr.message);
      return;
    }

    setNewLabel("");
    setNewQty("");
    setNewNotes("");
    await loadData();
  }

  async function claimItem(id: string, memberId: string) {
    const { error: claimErr } = await supabaseAdmin
      .from("grocery_items")
      .update({ claimed_by: memberId, claimed_at: new Date().toISOString() })
      .eq("id", id);

    if (claimErr) {
      setError(claimErr.message);
      return;
    }
    await loadData();
  }

  async function unclaimItem(id: string) {
    const { error: unclaimErr } = await supabaseAdmin
      .from("grocery_items")
      .update({ claimed_by: null, claimed_at: null })
      .eq("id", id);

    if (unclaimErr) {
      setError(unclaimErr.message);
      return;
    }
    await loadData();
  }

  function startEdit(item: GroceryItem) {
    setEditingId(item.id);
    setEditLabel(item.label);
    setEditQty(item.qty ?? "");
    setEditNotes(item.notes ?? "");
    setEditClaimedBy(item.claimed_by ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditLabel("");
    setEditQty("");
    setEditNotes("");
    setEditClaimedBy("");
  }

  async function saveEdit(id: string) {
    if (!editLabel.trim()) {
      setError("Item name is required");
      return;
    }

    const { error: saveErr } = await supabaseAdmin
      .from("grocery_items")
      .update({
        label: editLabel.trim(),
        qty: editQty.trim() || null,
        notes: editNotes.trim() || null,
        claimed_by: editClaimedBy || null,
        claimed_at: editClaimedBy ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (saveErr) {
      setError(saveErr.message);
      return;
    }

    cancelEdit();
    await loadData();
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this item?")) return;

    const { error: delErr } = await supabaseAdmin.from("grocery_items").delete().eq("id", id);

    if (delErr) {
      setError(delErr.message);
      return;
    }
    await loadData();
  }

  const getMemberName = (id: string) => members.find((m) => m.id === id)?.name ?? "Someone";

  return (
    <>
      <style>{`
        .grocery-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .grocery-table th {
          text-align: left;
          padding: 8px 10px;
          border-bottom: 2px solid #ddd;
          font-weight: 700;
          background: rgba(251,246,234,0.6);
        }
        .grocery-table td {
          padding: 6px 10px;
          border-bottom: 1px solid #f0f0f0;
          background: #fff;
        }
        .grocery-table tr:hover td {
          background: #fafafa;
        }
        .truncate {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }
        .filter-pills {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }
        .pill {
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid #ddd;
          background: #fff;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }
        .pill.active {
          background: #404D40;
          color: #fff;
          border-color: #404D40;
        }
        .btn-sm {
          padding: 4px 10px;
          font-size: 12px;
          border-radius: 6px;
          border: 1px solid #ddd;
          background: #fff;
          cursor: pointer;
          font-weight: 600;
        }
        .btn-sm:hover {
          background: #f5f5f5;
        }
        .btn-danger {
          color: crimson;
          border-color: crimson;
        }
        .add-row {
          display: grid;
          grid-template-columns: 2fr 1fr 2fr auto;
          gap: 10px;
          margin-bottom: 20px;
          align-items: center;
        }
        .add-row input {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 13px;
        }
        @media (max-width: 880px) {
          .grocery-table {
            font-size: 12px;
          }
          .grocery-table th,
          .grocery-table td {
            padding: 6px 8px;
          }
          .add-row {
            grid-template-columns: 1fr;
          }
          .truncate {
            max-width: 120px;
          }
        }
      `}</style>
      <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>Groceries</h1>

        {error && (
          <div style={{ padding: 12, background: "#ffe0e0", border: "1px solid crimson", borderRadius: 8, marginBottom: 16, color: "crimson" }}>
            {error}
          </div>
        )}

        <div className="add-row">
          <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Item" />
          <input value={newQty} onChange={(e) => setNewQty(e.target.value)} placeholder="Qty" />
          <input value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Notes (optional)" />
          <button className="btn-sm" onClick={addItem} disabled={adding}>
            {adding ? "Adding..." : "Add"}
          </button>
        </div>

        <div className="filter-pills">
          <button className={`pill ${filter === "unclaimed" ? "active" : ""}`} onClick={() => setFilter("unclaimed")}>
            Unclaimed ({items.filter((i) => !i.claimed_by).length})
          </button>
          <button className={`pill ${filter === "claimed" ? "active" : ""}`} onClick={() => setFilter("claimed")}>
            Claimed ({items.filter((i) => !!i.claimed_by).length})
          </button>
          <button className={`pill ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
            All ({items.length})
          </button>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="grocery-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Notes</th>
                <th>Claimed by</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 20, opacity: 0.6 }}>
                    No items
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isEditing = editingId === item.id;

                  return (
                    <tr key={item.id}>
                      <td>
                        {isEditing ? (
                          <input
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            style={{ width: "100%", padding: 6, border: "1px solid #ddd", borderRadius: 4 }}
                          />
                        ) : (
                          <span style={{ fontWeight: 600 }}>{item.label}</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            value={editQty}
                            onChange={(e) => setEditQty(e.target.value)}
                            style={{ width: "100%", padding: 6, border: "1px solid #ddd", borderRadius: 4 }}
                          />
                        ) : (
                          item.qty || "—"
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            style={{ width: "100%", padding: 6, border: "1px solid #ddd", borderRadius: 4 }}
                          />
                        ) : (
                          <span className="truncate" title={item.notes ?? ""}>
                            {item.notes || "—"}
                          </span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            value={editClaimedBy}
                            onChange={(e) => setEditClaimedBy(e.target.value)}
                            style={{ width: "100%", padding: 6, border: "1px solid #ddd", borderRadius: 4 }}
                          >
                            <option value="">Unclaimed</option>
                            {members.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        ) : item.claimed_by ? (
                          <span style={{ fontWeight: 600 }}>{getMemberName(item.claimed_by)}</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          {isEditing ? (
                            <>
                              <button className="btn-sm" onClick={() => saveEdit(item.id)}>
                                Save
                              </button>
                              <button className="btn-sm" onClick={cancelEdit}>
                                Cancel
                              </button>
                              <button className="btn-sm btn-danger" onClick={() => deleteItem(item.id)}>
                                Delete
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="btn-sm" onClick={() => startEdit(item)}>
                                Edit
                              </button>
                              {!item.claimed_by ? (
                                <select
                                  onChange={(e) => e.target.value && claimItem(item.id, e.target.value)}
                                  style={{ padding: "4px 8px", fontSize: 12, borderRadius: 6, border: "1px solid #ddd" }}
                                  defaultValue=""
                                >
                                  <option value="">Claim</option>
                                  {members.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <button className="btn-sm" onClick={() => unclaimItem(item.id)}>
                                  Unclaim
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </main>
    </>
  );
}
