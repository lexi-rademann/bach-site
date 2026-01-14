"use client";

import { useEffect, useMemo, useState } from "react";

type ItineraryItem = {
  id: string;
  day: string | null;        // YYYY-MM-DD
  start_time: string | null; // HH:MM:SS
  title: string;
  location: string | null;
  notes: string | null;
  link: string | null;
};

function formatDay(day: string) {
  // day is YYYY-MM-DD
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

function formatTime(t: string) {
  // t is HH:MM:SS
  const [hh, mm] = t.split(":").map(Number);
  const dt = new Date();
  dt.setHours(hh ?? 0, mm ?? 0, 0, 0);
  return dt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function ItineraryPage() {
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/itinerary");
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json?.error ?? "Failed to load itinerary");
      return;
    }

    setItems(json.items ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, ItineraryItem[]>();
    for (const item of items) {
      const key = item.day ?? "No date";
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [items]);

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Itinerary</h1>

      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div style={{ color: "crimson" }}>{error}</div>
      ) : items.length === 0 ? (
        <div style={{ opacity: 0.85 }}>
          No itinerary items yet. Add rows in Supabase → <b>itinerary_items</b>.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {grouped.map(([day, dayItems]) => (
            <section key={day} style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>
                {day === "No date" ? "No date" : formatDay(day)}
              </h2>

              <div style={{ display: "grid", gap: 10 }}>
                {dayItems.map((i) => (
                  <div key={i.id} style={{ border: "1px solid #f0f0f0", borderRadius: 12, padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ fontWeight: 800 }}>
                        {i.start_time ? `${formatTime(i.start_time)} • ` : ""}
                        {i.title}
                      </div>

                      {i.link ? (
                        <a href={i.link} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                          Link ↗
                        </a>
                      ) : null}
                    </div>

                    {i.location ? <div style={{ marginTop: 6, opacity: 0.85 }}>{i.location}</div> : null}
                    {i.notes ? <div style={{ marginTop: 6, opacity: 0.85 }}>{i.notes}</div> : null}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <button
        onClick={load}
        style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", cursor: "pointer" }}
      >
        Refresh
      </button>
    </main>
  );
}
