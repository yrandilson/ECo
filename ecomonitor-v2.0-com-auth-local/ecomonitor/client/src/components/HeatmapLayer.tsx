/**
 * HeatmapLayer — React-Leaflet component for rendering IRAC risk heatmap.
 *
 * Uses leaflet.heat (L.heatLayer) under the hood.
 * Data format: [lat, lng, intensity] where intensity ∈ 0..1
 *
 * Risk Score → Intensity mapping:
 *   0-20  (muito baixo) → 0.1
 *   21-40 (baixo)       → 0.3
 *   41-60 (moderado)    → 0.5
 *   61-80 (alto)        → 0.8
 *   81-100 (crítico)    → 1.0
 */
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

// Extend Leaflet types for leaflet.heat
declare module "leaflet" {
  function heatLayer(
    latlngs: Array<[number, number, number]>,
    options?: HeatMapOptions,
  ): Layer;

  interface HeatMapOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  /** Risk score 0–100 (from IRAC, riskScore, or severity) */
  intensity: number;
}

interface HeatmapLayerProps {
  points: HeatmapPoint[];
  /** Visible on the map */
  visible?: boolean;
  /** Radius of each point in pixels (default: 30) */
  radius?: number;
  /** Blur of each point in pixels (default: 20) */
  blur?: number;
  /** Max zoom at which points reach full intensity (default: 13) */
  maxZoom?: number;
}

/** IRAC-themed gradient: green → yellow → orange → red → dark-red */
const RISK_GRADIENT: Record<number, string> = {
  0.0: "#22c55e", // verde  → muito baixo
  0.25: "#84cc16", // verde-limão
  0.4: "#eab308", // amarelo → moderado
  0.6: "#f97316", // laranja → alto
  0.8: "#ef4444", // vermelho → crítico
  1.0: "#991b1b", // vermelho escuro → extremo
};

export default function HeatmapLayer({
  points,
  visible = true,
  radius = 30,
  blur = 20,
  maxZoom = 13,
}: HeatmapLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (!visible || points.length === 0) {
      // Remove existing layer
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }

    // Convert points to [lat, lng, normalizedIntensity]
    const heatData: Array<[number, number, number]> = points.map((p) => [
      p.lat,
      p.lng,
      Math.max(0.05, Math.min(1, p.intensity / 100)),
    ]);

    // Remove old layer before creating new one
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    layerRef.current = L.heatLayer(heatData, {
      radius,
      blur,
      maxZoom,
      max: 1.0,
      minOpacity: 0.3,
      gradient: RISK_GRADIENT,
    }).addTo(map);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, points, visible, radius, blur, maxZoom]);

  return null;
}
