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
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

function formatTime(t: string) {
  const [hh, mm] = t.split(":").map(Number);
  const dt = new Date();
  dt.setHours(hh ?? 0, mm ?? 0, 0, 0);
  return dt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function getLinkLabel(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    if (hostname.includes("airbnb")) return "Airbnb";
    if (hostname.includes("google.com/maps") || hostname.includes("maps.google") || hostname.includes("goo.gl")) return "Maps";
    if (hostname.includes("yelp")) return "Yelp";
    if (hostname.includes("opentable")) return "OpenTable";
    if (hostname.includes("resy")) return "Resy";
    if (hostname.includes("instagram")) return "Instagram";
    if (hostname.includes("facebook")) return "Facebook";
    // Fallback: capitalize first part of domain
    const name = hostname.split(".")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return "Link";
  }
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
    <>
      <h1 className="itinerary-title">Itinerary</h1>

      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div style={{ color: "crimson" }}>{error}</div>
      ) : items.length === 0 ? (
        <div style={{ opacity: 0.85 }}>
          No itinerary items yet. Add rows in Supabase → <b>itinerary_items</b>.
        </div>
      ) : (
        <div className="itinerary-days">
          {grouped.map(([day, dayItems]) => (
            <section key={day} className="day-card">
              <h2 className="day-title">
                {day === "No date" ? "No date" : formatDay(day)}
              </h2>

              <div className="day-items">
                {dayItems.map((item) => (
                  <div key={item.id} className="itinerary-item">
                    <div className="item-header">
                      {item.start_time && (
                        <span className="item-time">{formatTime(item.start_time)}</span>
                      )}
                      <span className="item-title">{item.title}</span>
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noreferrer" className="item-link-badge">
                          {getLinkLabel(item.link)} ↗
                        </a>
                      )}
                    </div>

                    {item.location && <div className="item-detail">{item.location}</div>}
                    {item.notes && <div className="item-detail">{item.notes}</div>}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
