"use client";

import Link from "next/link";
import Logo from "./Logo";
import Icon from "./Icon";

type Props = {
  signedIn?: boolean;
  current?: "dashboard" | "search" | "account";
};

const guestLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#parks", label: "Parks" },
  { href: "/#pricing", label: "Pricing" },
];

const authLinks = [
  { href: "/dashboard", key: "dashboard", label: "Dashboard" },
  { href: "/search", key: "search", label: "Search" },
  { href: "/account/profile", key: "account", label: "Account" },
];

export default function Nav({ signedIn = false, current }: Props) {
  const links = signedIn ? authLinks : guestLinks;

  return (
    <nav className="cs-nav">
      <Link href={signedIn ? "/dashboard" : "/"} style={{ background: "none", border: "none", padding: 0 }}>
        <Logo />
      </Link>

      <div className="cs-nav-links">
        {links.map((l) => {
          const k = ("key" in l ? l.key : l.href) as string;
          return (
            <Link
              key={k}
              href={l.href}
              className={"key" in l && current === l.key ? "active" : ""}
            >
              {l.label}
            </Link>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {signedIn ? (
          <>
            <Link href="/dashboard" className="cs-btn cs-btn--quiet cs-btn--sm">
              <Icon name="bell" size={15} />
            </Link>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "var(--accent)", color: "var(--bg)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 600,
            }}>JD</div>
          </>
        ) : (
          <>
            <Link href="/signup" className="cs-btn cs-btn--quiet cs-btn--sm">Sign in</Link>
            <Link href="/signup" className="cs-btn cs-btn--sm">Get started</Link>
          </>
        )}
      </div>
    </nav>
  );
}
