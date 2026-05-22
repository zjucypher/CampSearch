"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type MapCampground = {
  id: string;
  name: string;
  park: string;
  lat: number | null;
  lng: number | null;
};

interface Props {
  campgrounds: MapCampground[];
  activeId?: string;
  onSelect?: (id: string) => void;
  height?: number;
}

const CA_CENTER: [number, number] = [-119.5, 37.5];
const TILE_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// Hard-coded Field Notes palette so CSS vars don't need to resolve in imperatively created DOM nodes
const PRIMARY = "#3A4B36";
const PRIMARY_INK = "#FBF6EA";
const PARCHMENT = "#F5F2EA";

export default function CampMap({ campgrounds, activeId, onSelect, height = 460 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef(new Map<string, maplibregl.Marker>());
  const [ready, setReady] = useState(false);

  // Mount map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: TILE_STYLE,
      center: CA_CENTER,
      zoom: 5.8,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => setReady(true));
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
      markersRef.current.clear();
    };
  }, []);

  // Sync markers whenever data or active changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const incoming = new Set(campgrounds.map((c) => c.id));

    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!incoming.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Upsert markers
    campgrounds
      .filter((c) => c.lat != null && c.lng != null)
      .forEach((c) => {
        const isActive = c.id === activeId;

        if (markersRef.current.has(c.id)) {
          // Update existing marker style
          const el = markersRef.current.get(c.id)!.getElement() as HTMLButtonElement;
          el.style.background = isActive ? PRIMARY : PARCHMENT;
          el.style.color = isActive ? PRIMARY_INK : PRIMARY;
          el.style.transform = `scale(${isActive ? 1.25 : 1})`;
          el.style.zIndex = isActive ? "10" : "1";
          return;
        }

        const el = document.createElement("button");
        Object.assign(el.style, {
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: isActive ? PRIMARY : PARCHMENT,
          color: isActive ? PRIMARY_INK : PRIMARY,
          border: `2px solid ${PRIMARY}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "10px",
          fontWeight: "700",
          fontFamily: "sans-serif",
          cursor: "pointer",
          boxShadow: "0 1px 4px rgba(0,0,0,.3)",
          transition: "transform .15s, background .15s",
          transform: `scale(${isActive ? 1.25 : 1})`,
          zIndex: isActive ? "10" : "1",
          padding: "0",
        });
        el.textContent = c.name.charAt(0);
        el.title = c.name;
        el.addEventListener("click", () => onSelect?.(c.id));

        const marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([c.lng!, c.lat!])
          .addTo(map);

        markersRef.current.set(c.id, marker);
      });
  }, [campgrounds, activeId, onSelect, ready]);

  // Fly to active campground
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !activeId) return;
    const c = campgrounds.find((x) => x.id === activeId);
    if (c?.lat != null && c?.lng != null) {
      map.flyTo({ center: [c.lng, c.lat], zoom: 10, duration: 600, essential: true });
    }
  }, [activeId, campgrounds, ready]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height,
        borderRadius: "var(--cs-radius-lg)",
        overflow: "hidden",
        background: "var(--surface-2)",
      }}
    />
  );
}
