"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Logo from "./Logo";
import Icon from "./Icon";
import type { Database } from "@/lib/supabase/types";

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
  const router = useRouter();
  const links = signedIn ? authLinks : guestLinks;
  const [initials, setInitials] = useState("?");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!signedIn) return;
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("profiles") as any).select("full_name").eq("id", user.id).single().then(({ data }: { data: { full_name?: string } | null }) => {
        const name = data?.full_name ?? user.email ?? "";
        const parts = name.trim().split(/\s+/);
        setInitials(parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : name.slice(0, 2).toUpperCase());
      });
    });
  }, [signedIn]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSignOut() {
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <nav className="cs-nav">
      <Link href={signedIn ? "/dashboard" : "/"} style={{ background: "none", border: "none", padding: 0 }}>
        <Logo />
      </Link>

      <div className="cs-nav-links">
        {links.map((l) => {
          const k = ("key" in l ? l.key : l.href) as string;
          return (
            <Link key={k} href={l.href} className={"key" in l && current === l.key ? "active" : ""}>
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
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "var(--accent)", color: "var(--bg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                }}
              >{initials}</button>
              {menuOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0,
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: "var(--cs-radius)", minWidth: 160, zIndex: 100,
                  boxShadow: "0 4px 16px rgba(0,0,0,.1)",
                }}>
                  <Link href="/account/profile" onClick={() => setMenuOpen(false)}
                    style={{ display: "block", padding: "10px 14px", fontSize: 13, color: "var(--ink)", textDecoration: "none" }}>
                    Account settings
                  </Link>
                  <div style={{ borderTop: "1px solid var(--border)" }} />
                  <button onClick={handleSignOut}
                    style={{ display: "block", width: "100%", padding: "10px 14px", fontSize: 13, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link href="/login" className="cs-btn cs-btn--quiet cs-btn--sm">Sign in</Link>
            <Link href="/signup" className="cs-btn cs-btn--sm">Get started</Link>
          </>
        )}
      </div>
    </nav>
  );
}
