"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UnlockPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Wrong passcode. Try again.");
      return;
    }

router.push("/");
router.refresh();
  }

  return (
    <main style={{ maxWidth: 420, margin: "64px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
        Enter passcode
      </h1>
      <p style={{ marginBottom: 16, opacity: 0.8 }}>
        This site is for the bachelorette crew 🪩
      </p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Passcode"
          type="password"
          autoFocus
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ddd",
          }}
        />
        <button
          disabled={loading || passcode.length === 0}
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid #ddd",
            cursor: "pointer",
          }}
        >
          {loading ? "Unlocking…" : "Unlock"}
        </button>
        {error && <div style={{ color: "crimson", fontSize: 14 }}>{error}</div>}
      </form>
    </main>
  );
}
