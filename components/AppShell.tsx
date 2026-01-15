import Link from "next/link";
import { BackgroundDecor } from "./BackgroundDecor";

const nav = [
  { href: "/itinerary", label: "Itinerary" },
  { href: "/groceries", label: "Groceries" },
  { href: "/expenses", label: "Expenses" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <BackgroundDecor />

      <header className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <div className="tapestry-welcome">Welcome to</div>
            <div className="tapestry-camp">Camp Courtney</div>
          </div>
          <Link href="/" className="home-link">Home</Link>
        </div>

        <nav className="header-nav">
          <div className="nav-pills">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="tapestry-pill">
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="app-main">
        {children}
      </main>

      <footer className="app-footer">
        <form action="/api/logout" method="post">
          <button type="submit" className="logout-btn">
            Log out
          </button>
        </form>
      </footer>
    </div>
  );
}
