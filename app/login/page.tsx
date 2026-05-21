"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Nav from "@/components/cs/Nav";
import Icon from "@/components/cs/Icon";
import TopoBg from "@/components/cs/TopoBg";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  }

  async function handleGoogle() {
    const supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback?next=/dashboard` },
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Nav signedIn={false} />
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr" }}>

        {/* Left form */}
        <div style={{
          display: "flex", flexDirection: "column",
          padding: "60px",
          maxWidth: 540, margin: "0 auto", width: "100%",
          justifyContent: "center",
        }}>
          <h1 style={{ fontSize: 38, marginBottom: 10 }}>Welcome back</h1>
          <p className="cs-muted" style={{ marginBottom: 28, fontSize: 14.5 }}>
            Sign in to manage your campsite alerts.
          </p>

          {error && (
            <div style={{
              padding: "10px 14px", marginBottom: 16, borderRadius: 4,
              background: "color-mix(in oklch, var(--accent) 12%, transparent)",
              color: "var(--accent)", fontSize: 13, border: "1px solid color-mix(in oklch, var(--accent) 30%, transparent)",
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "grid", gap: 18, marginBottom: 24 }}>
            <div>
              <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Email</label>
              <input className="cs-input" type="email" placeholder="jordan@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div>
              <label className="cs-label" style={{ display: "block", marginBottom: 6 }}>Password</label>
              <input className="cs-input" type="password" placeholder="••••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
          </div>
          <button className="cs-btn cs-btn--lg" onClick={handleLogin} disabled={loading} style={{ width: "100%" }}>
            {loading ? "Signing in…" : <>Sign in <Icon name="arrow" size={16} /></>}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "20px 0", color: "var(--muted)", fontSize: 12 }}>
            <hr className="cs-divider" style={{ flex: 1 }} />
            <span>or</span>
            <hr className="cs-divider" style={{ flex: 1 }} />
          </div>
          <button className="cs-btn cs-btn--ghost" style={{ width: "100%" }} onClick={handleGoogle}>
            Continue with Google
          </button>
          <p className="cs-muted" style={{ marginTop: 24, fontSize: 12.5 }}>
            No account?{" "}
            <Link href="/signup" style={{ color: "var(--ink)", textDecoration: "underline" }}>Get started free</Link>
          </p>
        </div>

        {/* Right panel */}
        <div style={{
          background: "var(--bg-2)", position: "relative", overflow: "hidden",
          padding: 60, display: "flex", flexDirection: "column", justifyContent: "center",
        }}>
          <TopoBg opacity={0.22} color="var(--primary)" />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="cs-label" style={{ marginBottom: 16 }}>Always watching</div>
            <h3 style={{ fontSize: 26, marginBottom: 16, maxWidth: 360 }}>
              Your alerts never sleep — even when you do.
            </h3>
            <p className="cs-muted" style={{ fontSize: 14, lineHeight: 1.6, maxWidth: 360 }}>
              CampSearch polls Recreation.gov every 30–60 seconds and fires within 600ms of a match.
              Median booking window at Yosemite: 2 minutes 14 seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
