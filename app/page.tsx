import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic"; // always show fresh counts

function centsToDollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function Card({
  href,
  icon,
  title,
  desc,
  meta,
}: {
  href: string;
  icon: string;
  title: string;
  desc: string;
  meta: string;
}) {
  return (
    <Link
      href={href}
      className="patch-card"
      style={{
        display: "block",
        padding: 16,
        textDecoration: "none",
      }}
    >
      <div className="patch-title" style={{ fontSize: 16, marginBottom: 6 }}>
        {icon} {title}
      </div>
      <div style={{ marginBottom: 10, fontSize: 14, opacity: 0.8 }}>
        {desc}
      </div>
      <div style={{ fontSize: 13, opacity: 0.6, fontWeight: 600 }}>{meta}</div>
    </Link>
  );
}

export default async function HomePage() {
  const { count: groceriesTotal } = await supabaseAdmin
    .from("grocery_items")
    .select("id", { count: "exact", head: true });

  const { count: groceriesUnclaimed } = await supabaseAdmin
    .from("grocery_items")
    .select("id", { count: "exact", head: true })
    .is("claimed_by", null);

  const { count: bringTotal } = await supabaseAdmin
    .from("bring_items")
    .select("id", { count: "exact", head: true });

  const { count: bringUnassigned } = await supabaseAdmin
    .from("bring_items")
    .select("id", { count: "exact", head: true })
    .is("assigned_to", null);

  const { count: itineraryTotal } = await supabaseAdmin
    .from("itinerary_items")
    .select("id", { count: "exact", head: true });

  const { data: expenses, error: expensesErr } = await supabaseAdmin
    .from("expenses")
    .select("amount_cents");

  const expensesTotalCents =
    expensesErr || !expenses
      ? 0
      : expenses.reduce((sum, e) => sum + (e.amount_cents ?? 0), 0);

  const expensesCount = expenses?.length ?? 0;

  return (
<main style={{ padding: "24px 16px", maxWidth: 1000, margin: "0 auto" }}>
  <section className="hero">
        <div className="heroOverlay" />
        <div className="heroContent">
          <div className="heroWelcome">Welcome to</div>
          <div className="heroCamp">Camp Courtney</div>
        </div>
      </section>

      <section
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14,
        }}
      >
        <Card
          href="/itinerary"
          icon="🗺️"
          title="Itinerary"
          desc="Schedule, addresses, links"
          meta={`${itineraryTotal ?? 0} items`}
        />
        <Card
          href="/groceries"
          icon="🧺"
          title="Groceries"
          desc="Add + claim grocery items"
          meta={`${groceriesTotal ?? 0} items • ${groceriesUnclaimed ?? 0} unclaimed`}
        />
        <Card
          href="/bring"
          icon="🎒"
          title="What to bring"
          desc="Checklist + who’s bringing what"
          meta={`${bringTotal ?? 0} items • ${bringUnassigned ?? 0} unassigned`}
        />
        <Card
          href="/expenses"
          icon="🧾"
          title="Expenses"
          desc="Add expenses + custom splits"
          meta={`${expensesCount} expenses • ${centsToDollars(expensesTotalCents)} total`}
        />
        <Card
          href="/balances"
          icon="🤝"
          title="Balances"
          desc="Who owes who + settle up"
          meta="View settle-up"
        />
      </section>
    </main>
  );
}
