"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";

function toNullIfEmpty(v: unknown) {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

function coerceId(raw: unknown) {
  const s = String(raw ?? "").trim();
  return s.length ? s : null; // ✅ works for UUID or numeric ids
}

export async function addGroceryItem(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  const qty = String(formData.get("qty") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!label) return;

  const { error } = await supabaseAdmin.from("grocery_items").insert({
    label,
    qty: qty || null,
    notes: notes || null,
    claimed_by: null,
  });

  if (error) throw new Error(`Add grocery item failed: ${error.message}`);

  revalidatePath("/groceries");
}

export async function saveGroceryItem(formData: FormData) {
  const id = coerceId(formData.get("id"));
  if (!id) return;

  const qty = String(formData.get("qty") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const claimed_by = toNullIfEmpty(formData.get("claimed_by"));

  const { error } = await supabaseAdmin
    .from("grocery_items")
    .update({
      qty: qty || null,
      notes: notes || null,
      claimed_by,
    })
    .eq("id", id); // ✅ string id

  if (error) throw new Error(`Save grocery item failed: ${error.message}`);

  revalidatePath("/groceries");
}

export async function deleteGroceryItem(formData: FormData) {
  const id = coerceId(formData.get("id"));
  if (!id) return;

  const { error } = await supabaseAdmin.from("grocery_items").delete().eq("id", id);

  if (error) throw new Error(`Delete grocery item failed: ${error.message}`);

  revalidatePath("/groceries");
}
