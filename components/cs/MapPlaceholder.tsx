"use client";

import type { Campground } from "@/lib/data";
import TopoBg from "./TopoBg";
import Icon from "./Icon";

type Props = {
  campgrounds: Campground[];
  activeId?: string;
  onSelect?: (id: string) => void;
  height?: number;
};

export default function MapPlaceholder({ campgrounds, activeId, onSelect, height = 420 }: Props) {
  return (
    <div className="cs-map" style={{ height }}>
      <TopoBg opacity={0.5} color="var(--border-strong)" />

      {/* Lake shape */}
      <div style={{
        position: "absolute", left: "32%", top: "44%",
        width: 110, height: 70,
        background: "color-mix(in oklch, var(--primary) 12%, var(--bg-2))",
        borderRadius: "60% 50% 70% 50%",
        border: "1px solid color-mix(in oklch, var(--primary) 30%, transparent)",
      }} />

      {/* Coastline hint */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: "10%",
        background: "linear-gradient(to right, color-mix(in oklch, var(--primary) 8%, transparent), transparent)",
      }} />

      <div style={{
        position: "absolute", right: 16, bottom: 14,
        fontFamily: "var(--font-mono)", fontSize: 10,
        letterSpacing: "0.18em", color: "var(--muted)", textTransform: "uppercase",
      }}>
        California · scale ≈ 1:4.2M
      </div>

      {campgrounds.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect?.(c.id)}
          className={`cs-pin${activeId === c.id ? " cs-pin--active" : ""}`}
          style={{ left: `${c.coords.x}%`, top: `${c.coords.y}%`, border: "none", padding: 0, background: "none" }}
          title={c.name}
        >
          <span>
            <Icon name="tent" size={12} strokeWidth={2} />
          </span>
        </button>
      ))}
    </div>
  );
}
