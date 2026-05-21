import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  sub?: string;
  action?: ReactNode;
};

export default function SectionHead({ eyebrow, title, sub, action }: Props) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, gap: 32 }}>
      <div>
        {eyebrow && <div className="cs-label" style={{ marginBottom: 8 }}>{eyebrow}</div>}
        <h2 style={{ fontSize: 28, marginBottom: sub ? 6 : 0 }}>{title}</h2>
        {sub && <div className="cs-muted" style={{ maxWidth: 540 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}
