"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

type Props = {
  /** Fallback alt text and placeholder label */
  label?: string;
  /** Explicit image URL (e.g. campground.photo_url from DB) */
  src?: string | null;
  /** Seed for deterministic Picsum image when src is absent */
  seed?: string;
  /** Picsum image width hint (default 800) */
  imgWidth?: number;
  /** Picsum image height hint (default 600) */
  imgHeight?: number;
  height?: number | string;
  style?: CSSProperties;
  className?: string;
};

function picsumUrl(seed: string, w: number, h: number): string {
  const clean = seed.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  return `https://picsum.photos/seed/${clean}/${w}/${h}`;
}

export default function Photo({
  label = "photo",
  src,
  seed,
  imgWidth = 800,
  imgHeight = 600,
  height = 200,
  style,
  className,
}: Props) {
  const [errored, setErrored] = useState(false);

  const imgSrc =
    !errored && (src || seed)
      ? src ?? picsumUrl(seed!, imgWidth, imgHeight)
      : null;

  if (imgSrc) {
    return (
      <div
        className={`cs-photo${className ? ` ${className}` : ""}`}
        style={{ height, ...style, overflow: "hidden", padding: 0 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={label}
          onError={() => setErrored(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={`cs-photo${className ? ` ${className}` : ""}`} style={{ height, ...style }}>
      <span>{label}</span>
    </div>
  );
}
