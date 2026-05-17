"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});
type GraveLocationMapProps = {
  lat?: number | null;
  lng?: number | null;
  onChange?: (lat: number, lng: number) => void;
  readOnly?: boolean;
  height?: string;
};

export default function GraveLocationMap({
  lat,
  lng,
  onChange,
  readOnly = false,
  height = "420px",
}: GraveLocationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const startLat = lat != null ? Number(lat) : 39.8283;
    const startLng = lng != null ? Number(lng) : -98.5795;
    const startZoom = lat != null && lng != null ? 19 : 4;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
      boxZoom: true,
      keyboard: true,
    });

    mapRef.current = map;

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 22,
      }
    ).addTo(map);

    map.setView([startLat, startLng], startZoom, { animate: false });

    if (lat != null && lng != null) {
      markerRef.current = L.marker([startLat, startLng]).addTo(map);
    }

    if (!readOnly) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        const nextLat = e.latlng.lat;
        const nextLng = e.latlng.lng;

        if (markerRef.current) {
          markerRef.current.setLatLng([nextLat, nextLng]);
        } else {
          markerRef.current = L.marker([nextLat, nextLng]).addTo(map);
        }

        map.setView([nextLat, nextLng], 19, { animate: false });
        onChange?.(nextLat, nextLng);
      });
    }

    setTimeout(() => {
  if (!mapRef.current) return;
  mapRef.current.invalidateSize();
}, 250);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [readOnly, onChange, lat, lng]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (lat == null || lng == null) return;

    const nextLat = Number(lat);
    const nextLng = Number(lng);

    if (Number.isNaN(nextLat) || Number.isNaN(nextLng)) return;

    const map = mapRef.current;

    if (markerRef.current) {
      markerRef.current.setLatLng([nextLat, nextLng]);
    } else {
      markerRef.current = L.marker([nextLat, nextLng]).addTo(map);
    }

    map.setView([nextLat, nextLng], 19, { animate: false });

    
    setTimeout(() => {
  if (!mapRef.current) return;
  mapRef.current.invalidateSize();
}, 150);
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height,
        borderRadius: "16px",
        overflow: "hidden",
      }}
    />
  );
}