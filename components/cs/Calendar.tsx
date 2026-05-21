import type { CalDay } from "@/lib/data";
import Icon from "./Icon";

type CalData = { month: string; days: CalDay[] };

export default function Calendar({ cal }: { cal: CalData }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <button className="cs-btn cs-btn--quiet cs-btn--sm" style={{ padding: "4px 8px" }}>
          <Icon name="chevron" size={14} style={{ transform: "rotate(180deg)" }} />
        </button>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 500 }}>{cal.month}</div>
        <button className="cs-btn cs-btn--quiet cs-btn--sm" style={{ padding: "4px 8px" }}>
          <Icon name="chevron" size={14} />
        </button>
      </div>
      <div className="cs-cal">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="cs-cal-h">{d}</div>
        ))}
        {cal.days.map((d, i) => {
          let cls = "cs-cal-d";
          if (d.out) cls += " cs-cal-d--out";
          if (d.range === "start") cls += " cs-cal-d--start";
          else if (d.range === "end") cls += " cs-cal-d--end";
          else if (d.range === "mid") cls += " cs-cal-d--mid";
          else if (d.avail) cls += " cs-cal-d--avail";
          return <div key={i} className={cls}>{d.d}</div>;
        })}
      </div>
    </div>
  );
}
