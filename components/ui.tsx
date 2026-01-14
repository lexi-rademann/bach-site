import Link from "next/link";

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        borderRadius: "var(--radius)",
        background: "rgba(246,241,230,.82)",
        border: "1px solid rgba(31,58,46,.14)",
        boxShadow: "var(--shadow)",
        padding: 16,
      }}
    >
      {children}
    </div>
  );
}

export function CardLink({
  href,
  title,
  desc,
  meta,
  icon,
}: {
  href: string;
  title: string;
  desc: string;
  meta?: string;
  icon?: string;
}) {
  return (
    <Link href={href} className="camp-card camp-card-pad" style={{ display: "block", textDecoration: "none" }}>
    <div className="camp-title" style={{ fontSize: 18 }}>
      {icon ? `${icon} ` : ""}{title}
    </div>
    <div style={{ opacity: 0.82, marginTop: 6 }}>{desc}</div>
    {meta ? <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>{meta}</div> : null}
  </Link>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 12px",
        borderRadius: 999,
        border: "1px solid rgba(31,58,46,.2)",
        background: "linear-gradient(180deg, rgba(76,107,79,.18), rgba(31,58,46,.10))",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 700,
      }}
    >
      {children}
    </button>
  );
}
