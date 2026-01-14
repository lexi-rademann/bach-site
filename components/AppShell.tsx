import Link from "next/link";
import { BackgroundDecor } from "./BackgroundDecor";

const nav = [
  { href: "/", label: "Home" },
  { href: "/itinerary", label: "Itinerary" },
  { href: "/groceries", label: "Groceries" },
  { href: "/expenses", label: "Expenses" },
  { href: "/balances", label: "Balances" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <BackgroundDecor />
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(10px)",
          background: "rgba(251,246,234,.88)",
          borderBottom: "2px solid rgba(64,77,64,.18)",
        }}
      >
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "grid", gap: 2 }}>
            <div className="tapestry-welcome" style={{ fontSize: 18, lineHeight: 1 }}>
              Welcome to
            </div>
            <div className="tapestry-camp" style={{ fontSize: 14, lineHeight: 1.1 }}>
              Camp Courtney
            </div>
          </div>

          <form action="/api/logout" method="post">
            <button className="tapestry-btn" type="submit">
              Log out
            </button>
          </form>
        </div>

        <nav style={{ maxWidth: 1000, margin: "0 auto", padding: "0 16px 12px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="tapestry-pill">
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main style={{ flex: 1, maxWidth: 1000, margin: "0 auto", padding: "18px 16px 40px", width: "100%" }}>
        {children}
      </main>
    </div>
  );
}
    
