"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";

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
  height?: number | string;
}

const CA_CENTER: [number, number] = [-119.5, 37.5];
const TILE_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// Field Notes palette — hardcoded so they work inside WebGL paint expressions
const PRIMARY = "#3A4B36";
const PRIMARY_INK = "#FBF6EA";
const PARCHMENT = "#F5F2EA";

const SOURCE_ID = "campgrounds";
const LAYER_CIRCLE = "campgrounds-circle";
const LAYER_LABEL = "campgrounds-label";

function toGeoJSON(campgrounds: MapCampground[], activeId?: string): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: campgrounds
      .filter((c) => c.lat != null && c.lng != null)
      .map((c) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [c.lng!, c.lat!] },
        properties: {
          id: c.id,
          label: c.name.charAt(0).toUpperCase(),
          active: c.id === activeId ? 1 : 0,
        },
      })),
  };
}

export default function CampMap({ campgrounds, activeId, onSelect, height = 460 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
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

    map.on("load", () => {
      // GeoJSON source — updated later when campgrounds change
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      // Circle layer — rendered by WebGL, no lag during pan
      map.addLayer({
        id: LAYER_CIRCLE,
        type: "circle",
        source: SOURCE_ID,
        paint: {
          "circle-radius": ["case", ["==", ["get", "active"], 1], 14, 11],
          "circle-color": ["case", ["==", ["get", "active"], 1], PRIMARY, PARCHMENT],
          "circle-stroke-color": PRIMARY,
          "circle-stroke-width": 2,
          "circle-opacity": 1,
          "circle-pitch-alignment": "map",
        },
      });

      // Single-letter label inside the circle
      map.addLayer({
        id: LAYER_LABEL,
        type: "symbol",
        source: SOURCE_ID,
        layout: {
          "text-field": ["get", "label"],
          "text-size": ["case", ["==", ["get", "active"], 1], 12, 10],
          "text-font": ["Noto Sans Bold"],
          "text-allow-overlap": true,
          "text-ignore-placement": true,
        },
        paint: {
          "text-color": ["case", ["==", ["get", "active"], 1], PRIMARY_INK, PRIMARY],
          "text-halo-color": "rgba(0,0,0,0)",
          "text-halo-width": 0,
        },
      });

      // Click on circle → notify parent
      map.on("click", LAYER_CIRCLE, (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (id) onSelect?.(id);
      });

      // Pointer cursor on hover
      map.on("mouseenter", LAYER_CIRCLE, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", LAYER_CIRCLE, () => {
        map.getCanvas().style.cursor = "";
      });

      setReady(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync GeoJSON data whenever campgrounds or active selection changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    source?.setData(toGeoJSON(campgrounds, activeId));
  }, [campgrounds, activeId, ready]);

  // Update click handler ref so it always closes over the latest onSelect
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const handler = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      const id = e.features?.[0]?.properties?.id as string | undefined;
      if (id) onSelect?.(id);
    };

    map.off("click", LAYER_CIRCLE, handler);
    map.on("click", LAYER_CIRCLE, handler);

    return () => { map.off("click", LAYER_CIRCLE, handler); };
  }, [onSelect, ready]);

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
        position: "relative",
        width: "100%",
        height,
        flex: typeof height === "string" && height.includes("%") ? 1 : undefined,
        borderRadius: "var(--cs-radius-lg)",
        overflow: "hidden",
        background: "var(--surface-2)",
        minHeight: 200,
      }}
    />
  );
}
