import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  // First: fetch with sort_order if it exists
  const attempt1 = await supabaseAdmin
    .from("members")
    .select("*")
    .order("sort_order", { ascending: true });

  if (!attempt1.error) {
    // Normalize output to { id, name, sort_order? }
    const members = (attempt1.data ?? []).map((m: any) => ({
      id: m.id ?? null,
      name: m.name ?? m.label ?? m.full_name ?? null,
      sort_order: m.sort_order ?? null,
    }));
    return NextResponse.json({ ok: true, members });
  }

  // If sort_order column doesn't exist, Supabase often returns an error.
  // Fallback: order by name instead.
  const attempt2 = await supabaseAdmin.from("members").select("*").order("name", { ascending: true });

  if (attempt2.error) {
    return NextResponse.json(
      {
        ok: false,
        error: attempt2.error.message,
        // helpful debug info so you can see what the first error was
        detail: {
          first_attempt_error: attempt1.error.message,
        },
      },
      { status: 500 }
    );
  }

  const members = (attempt2.data ?? []).map((m: any) => ({
    id: m.id ?? null,
    name: m.name ?? m.label ?? m.full_name ?? null,
    sort_order: m.sort_order ?? null,
  }));

  return NextResponse.json({ ok: true, members });
}
