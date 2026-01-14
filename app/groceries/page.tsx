import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { addGroceryItem, saveGroceryItem, deleteGroceryItem } from "./actions";

export const dynamic = "force-dynamic";

type GroceryItem = {
  id: string | number; // ✅ supports UUID or numeric
  label: string;
  qty: string | null;
  notes: string | null;
  claimed_by: string | null;
};

export default async function GroceriesPage() {
  const { data: members, error: membersError } = await supabaseAdmin
    .from("members")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true });

  const memberList = (members ?? [])
    .filter((m) => m.id && m.name)
    .map((m) => ({ id: m.id as string, name: m.name as string }));

  const { data: items, error: itemsError } = await supabaseAdmin
    .from("grocery_items")
    .select("id,label,qty,notes,claimed_by")
    .order("id", { ascending: false });

  const groceryItems = (items ?? []) as GroceryItem[];

  const unclaimed = groceryItems.filter((i) => !i.claimed_by);
  const claimed = groceryItems.filter((i) => !!i.claimed_by);

return (
  <>
    <style>{`
      @media (max-width: 880px) {
        .grocery-row-grid {
          display: grid !important;
          grid-template-columns: 1fr !important;
          gap: 12px !important;
        }
        
        .grocery-row-grid label,
        .grocery-row-grid button {
          width: 100% !important;
        }
      }
    `}</style>
    <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Groceries</h1>

      {(membersError || itemsError) && (
        <div
          style={{
            margin: "12px 0 18px",
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(180,0,0,.25)",
            background: "rgba(255,0,0,.05)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Data error</div>
          {membersError && <div>Members error: {membersError.message}</div>}
          {itemsError && <div>Grocery items error: {itemsError.message}</div>}
        </div>
      )}

      {/* Add item */}
      <section style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Add an item</h2>

        <form action={addGroceryItem}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr auto", gap: 12, alignItems: "end" }}>
            <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
              <span style={{ fontWeight: 600 }}>Item</span>
              <input name="label" placeholder="Chips" style={{ width: "100%", minWidth: 0, padding: 10, border: "1px solid #ddd", borderRadius: 10, boxSizing: "border-box" }} />
            </label>

            <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
              <span style={{ fontWeight: 600 }}>Qty</span>
              <input name="qty" placeholder="2 bags" style={{ width: "100%", minWidth: 0, padding: 10, border: "1px solid #ddd", borderRadius: 10, boxSizing: "border-box" }} />
            </label>

            <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
              <span style={{ fontWeight: 600 }}>Notes (optional)</span>
              <input name="notes" placeholder="Any brand is fine" style={{ width: "100%", minWidth: 0, padding: 10, border: "1px solid #ddd", borderRadius: 10, boxSizing: "border-box" }} />
            </label>

            <button type="submit" style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer", fontWeight: 600 }}>
              Add
            </button>
          </div>
        </form>
      </section>

      {/* Unclaimed */}
      <section style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Unclaimed ({unclaimed.length})</h2>
          <div style={{ opacity: 0.7, fontSize: 13 }}>
            Pick a name in <b>Claimed by</b> → <b>Save</b>
          </div>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {unclaimed.map((item) => (
            <GroceryRow key={String(item.id)} item={item} memberList={memberList} />
          ))}

          {unclaimed.length === 0 && <div style={{ opacity: 0.7, padding: 8 }}>Nothing unclaimed!</div>}
        </div>
      </section>

      {/* Claimed */}
      <section style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Claimed ({claimed.length})</h2>

        <div style={{ display: "grid", gap: 8 }}>
          {claimed.map((item) => (
            <GroceryRow key={String(item.id)} item={item} memberList={memberList} />
          ))}

          {claimed.length === 0 && <div style={{ opacity: 0.7, padding: 8 }}>No claimed items yet.</div>}
        </div>
      </section>
    </main>
  </>
  );
}

function GroceryRow({
  item,
  memberList,
}: {
  item: GroceryItem;
  memberList: { id: string; name: string }[];
}) {
  const inputStyle = {
    width: "100%",
    minWidth: 0,
    padding: 10,
    border: "1px solid #ddd",
    borderRadius: 10,
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "grid",
    gap: 6,
    minWidth: 0,
  };

  return (
    <div style={{ border: "1px solid #f0f0f0", borderRadius: 10, padding: 12 }}>
<div className="grocery-row-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr 1.5fr auto auto", gap: 12, alignItems: "end" }}>
  <label style={labelStyle}>
          <span style={{ fontWeight: 600 }}>Item</span>
          <input
            value={item.label}
            readOnly
            style={{ ...inputStyle, background: "#f9f9f9" }}
          />
        </label>

        <form action={saveGroceryItem} style={{ display: "contents" }}>
          <input type="hidden" name="id" value={String(item.id)} />

          <label style={labelStyle}>
            <span style={{ fontWeight: 600 }}>Qty</span>
            <input name="qty" defaultValue={item.qty ?? ""} style={inputStyle} />
          </label>

          <label style={labelStyle}>
            <span style={{ fontWeight: 600 }}>Notes</span>
            <input name="notes" defaultValue={item.notes ?? ""} style={inputStyle} />
          </label>

          <label style={labelStyle}>
            <span style={{ fontWeight: 600 }}>Claimed by</span>
            <select name="claimed_by" defaultValue={item.claimed_by ?? ""} style={inputStyle}>
              <option value="">Unclaimed</option>
              {memberList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer", fontWeight: 600 }}>
            Save
          </button>
        </form>

        <form action={deleteGroceryItem}>
          <input type="hidden" name="id" value={String(item.id)} />
          <button
            type="submit"
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #ddd",
              cursor: "pointer",
              fontWeight: 600,
              color: "crimson",
            }}
          >
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}
