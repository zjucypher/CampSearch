import type { ReactNode } from "react";

type Props = {
  num: string;
  title: string;
  sub?: string;
  children: ReactNode;
};

export default function FormGroup({ num, title, sub, children }: Props) {
  return (
    <section style={{ padding: "28px 0", borderTop: "1px solid var(--border)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 20 }}>
        <div className="cs-mono" style={{ paddingTop: 4, color: "var(--muted)", fontSize: 11, letterSpacing: "0.14em" }}>
          {num}
        </div>
        <div>
          <h3 style={{ fontSize: 20, marginBottom: 4 }}>{title}</h3>
          {sub && <p className="cs-muted" style={{ fontSize: 13, marginBottom: 18 }}>{sub}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}
