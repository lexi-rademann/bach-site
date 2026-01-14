"use client";

import { useState } from "react";

type Member = { id: string; name: string; sort_order: number };
type GroceryItem = {
  id: string;
  label: string;
  qty: string | null;
  notes: string | null;
  claimed_by: string | null;
  claimed_at: string | null;
  created_at: string;
  category: string | null;
};

const CATEGORIES = [
  "cocktails and mocktails",
  "pizza night",
  "taco night (add-ons)",
  "breakfast",
  "snacks",
  "house stuff",
] as const;

export function GroceriesClient({
  initialMembers,
  initialItems,
}: {
  initialMembers: Member[];
  initialItems: GroceryItem[];
}) {
  const [members] = useState<Member[]>(initialMembers);
  const [items, setItems] = useState<GroceryItem[]>(initialItems);
  const [filter, setFilter] = useState<"unclaimed" | "claimed" | "all">("unclaimed");
  const [error, setError] = useState<string | null>(null);

  // Add form state
  const [newLabel, setNewLabel] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newCategory, setNewCategory] = useState<string>("snacks");
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editClaimedBy, setEditClaimedBy] = useState("");
  const [editCategory, setEditCategory] = useState("");

  const filteredItems = items.filter((item) => {
    if (filter === "unclaimed") return !item.claimed_by;
    if (filter === "claimed") return !!item.claimed_by;
    return true;
  });

  // Group items by category
  const itemsByCategory = CATEGORIES.map((category) => ({
    category,
    items: filteredItems.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);

console.log("All items:", items); // Add this
console.log("Filtered items:", filteredItems); // Add this
console.log("Items by category:", itemsByCategory);

  async function refreshData() {
    const res = await fetch("/api/groceries");
    const data = await res.json();
    if (data.items) setItems(data.items);
  }

  async function addItem() {
    if (!newLabel.trim()) {
      setError("Item name is required");
      return;
    }
    setAdding(true);
    setError(null);

    const res = await fetch("/api/groceries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: newLabel.trim(),
        qty: newQty.trim() || null,
        notes: newNotes.trim() || null,
        category: newCategory,
      }),
    });

    setAdding(false);
    if (!res.ok) {
      setError("Failed to add item");
      return;
    }

    setNewLabel("");
    setNewQty("");
    setNewNotes("");
    setNewCategory("snacks");
    await refreshData();
  }

  async function claimItem(id: string, memberId: string) {
    const res = await fetch(`/api/groceries?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        claimed_by: memberId,
        claimed_at: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      setError("Failed to claim item");
      return;
    }
    await refreshData();
  }

  async function unclaimItem(id: string) {
    const res = await fetch(`/api/groceries?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        claimed_by: null,
        claimed_at: null,
      }),
    });

    if (!res.ok) {
      setError("Failed to unclaim item");
      return;
    }
    await refreshData();
  }

  function startEdit(item: GroceryItem) {
    setEditingId(item.id);
    setEditLabel(item.label);
    setEditQty(item.qty ?? "");
    setEditNotes(item.notes ?? "");
    setEditClaimedBy(item.claimed_by ?? "");
    setEditCategory(item.category ?? "snacks");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditLabel("");
    setEditQty("");
    setEditNotes("");
    setEditClaimedBy("");
    setEditCategory("");
  }

  async function saveEdit(id: string) {
    if (!editLabel.trim()) {
      setError("Item name is required");
      return;
    }

    const res = await fetch(`/api/groceries?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: editLabel.trim(),
        qty: editQty.trim() || null,
        notes: editNotes.trim() || null,
        claimed_by: editClaimedBy || null,
        claimed_at: editClaimedBy ? new Date().toISOString() : null,
        category: editCategory,
      }),
    });

    if (!res.ok) {
      setError("Failed to save item");
      return;
    }

    cancelEdit();
    await refreshData();
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this item?")) return;

    const res = await fetch(`/api/groceries?id=${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      setError("Failed to delete item");
      return;
    }
    await refreshData();
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
          grid-template-columns: 2fr 1fr 2fr 1.5fr auto;
          gap: 10px;
          margin-bottom: 20px;
          align-items: center;
        }
        .add-row input,
        .add-row select {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 13px;
        }
        .category-section {
          margin-bottom: 24px;
        }
        .category-header {
          font-size: 18px;
          font-weight: 800;
          text-transform: capitalize;
          margin-bottom: 10px;
          padding: 8px 12px;
          background: rgba(64,77,64,0.08);
          border-radius: 8px;
        }
        @media (max-width: 880px) {
          .grocery-table-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .grocery-table {
            font-size: 12px;
            min-width: 600px;
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
          <div
            style={{
              padding: 12,
              background: "#ffe0e0",
              border: "1px solid crimson",
              borderRadius: 8,
              marginBottom: 16,
              color: "crimson",
            }}
          >
            {error}
          </div>
        )}

        <div className="add-row">
          <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Item" />
          <input value={newQty} onChange={(e) => setNewQty(e.target.value)} placeholder="Qty" />
          <input value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Notes (optional)" />
          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
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

        {itemsByCategory.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", opacity: 0.6 }}>No items</div>
        ) : (
          itemsByCategory.map((group) => (
            <div key={group.category} className="category-section">
              <div className="category-header">{group.category}</div>
              <div className="grocery-table-wrapper">
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
                    {group.items.map((item) => {
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
                                  <select
                                    value={editCategory}
                                    onChange={(e) => setEditCategory(e.target.value)}
                                    style={{ padding: "4px 8px", fontSize: 12, borderRadius: 6, border: "1px solid #ddd" }}
                                  >
                                    {CATEGORIES.map((cat) => (
                                      <option key={cat} value={cat}>
                                        {cat}
                                      </option>
                                    ))}
                                  </select>
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
                                      style={{
                                        padding: "4px 8px",
                                        fontSize: 12,
                                        borderRadius: 6,
                                        border: "1px solid #ddd",
                                      }}
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
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </main>
    </>
  );
}
