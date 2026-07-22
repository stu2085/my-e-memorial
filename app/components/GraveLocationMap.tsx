"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
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

  const onChangeRef = useRef(onChange);
  const readOnlyRef = useRef(readOnly);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    readOnlyRef.current = readOnly;
  }, [readOnly]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const startLat =
      lat != null && Number.isFinite(Number(lat))
        ? Number(lat)
        : 39.8283;

    const startLng =
      lng != null && Number.isFinite(Number(lng))
        ? Number(lng)
        : -98.5795;

    const hasCoordinates =
      lat != null &&
      lng != null &&
      Number.isFinite(Number(lat)) &&
      Number.isFinite(Number(lng));

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

    map.setView(
      [startLat, startLng],
      hasCoordinates ? 19 : 4,
      { animate: false }
    );

    if (hasCoordinates) {
      markerRef.current = L.marker([startLat, startLng]).addTo(map);
    }

    map.on("click", (e: L.LeafletMouseEvent) => {
      if (readOnlyRef.current) return;

      const nextLat = e.latlng.lat;
      const nextLng = e.latlng.lng;

      if (markerRef.current) {
        markerRef.current.setLatLng([nextLat, nextLng]);
      } else {
        markerRef.current = L.marker([nextLat, nextLng]).addTo(map);
      }

      map.setView([nextLat, nextLng], 19, {
        animate: false,
      });

      onChangeRef.current?.(nextLat, nextLng);
    });

    window.setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };

    // Leaflet must be initialized only once.
    // Coordinate changes are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
  const map = mapRef.current;

  if (!map || lat == null || lng == null) return;

  const nextLat = Number(lat);
  const nextLng = Number(lng);

  if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) {
    return;
  }

  if (markerRef.current) {
    markerRef.current.setLatLng([nextLat, nextLng]);
  } else {
    markerRef.current = L.marker([nextLat, nextLng]).addTo(map);
  }

  const timeoutId = window.setTimeout(() => {
    const mapContainer = map.getContainer();

    if (!mapContainer || !mapContainer.isConnected) {
      return;
    }

    map.invalidateSize();

    map.setView([nextLat, nextLng], 19, {
      animate: false,
    });
  }, 100);

  return () => {
    window.clearTimeout(timeoutId);
  };
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