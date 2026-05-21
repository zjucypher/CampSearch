export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-8 text-center">
      <span className="cs-label mb-6">Monitoring 138 California campgrounds</span>
      <h1
        style={{ fontFamily: "var(--font-display)", fontSize: 64, lineHeight: 1.02, letterSpacing: "-0.02em" }}
        className="text-ink mb-6 max-w-2xl font-normal"
      >
        Get notified the second a campsite opens up.
      </h1>
      <p className="text-ink-2 max-w-xl leading-relaxed mb-10">
        CampSearch watches Yosemite, Big Sur, Joshua Tree and 135 other California
        campgrounds and pings you the moment a site matching your criteria becomes
        available.
      </p>
      <div className="flex items-center gap-3">
        <button className="cs-btn cs-btn--lg">Start monitoring — free</button>
        <button className="cs-btn cs-btn--ghost cs-btn--lg">Browse campgrounds</button>
      </div>
      <p className="cs-label mt-16 opacity-50">Phase 0 scaffold — design system wired</p>
    </main>
  );
}
