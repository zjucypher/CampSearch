import type { Metadata } from "next";
import { Source_Serif_4, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";

const sourceSerif4 = Source_Serif_4({
  variable: "--font-source-serif-4",
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "CampSearch — California Campsite Availability Monitoring",
    template: "%s · CampSearch",
  },
  description:
    "Get notified the second a campsite opens up. CampSearch watches California campgrounds across Yosemite, Big Sur, Tahoe, and more — and pings you the moment a site opens.",
  keywords: ["campsite availability", "recreation.gov alert", "yosemite camping", "california camping", "campsite monitor"],
  openGraph: {
    title: "CampSearch — California Campsite Availability Monitoring",
    description: "Stop refreshing Recreation.gov. CampSearch watches for you and fires the moment a site opens.",
    siteName: "CampSearch",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CampSearch",
    description: "California campsite availability monitoring. Get notified in seconds.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${sourceSerif4.variable} ${interTight.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
