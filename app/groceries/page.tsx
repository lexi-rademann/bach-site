import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { GroceriesClient } from "./GroceriesClient";

export const dynamic = "force-dynamic";

export default async function GroceriesPage() {
  const { data: members } = await supabaseAdmin
    .from("members")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true });

  const { data: items } = await supabaseAdmin
    .from("grocery_items")
    .select("id, label, qty, notes, claimed_by, claimed_at, created_at")
    .order("claimed_by", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: false });

  return <GroceriesClient initialMembers={members ?? []} initialItems={items ?? []} />;
}
