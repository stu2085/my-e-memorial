"use client";

import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";

type Props = {
  lat: number | null;
  lng: number | null;
  onChange?: (coords: { lat: number; lng: number }) => void;
  readOnly?: boolean;
};

const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 };

export default function GraveLocationGoogleMap({
  lat,
  lng,
  onChange,
  readOnly = false,
}: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="p-4 text-red-600">
        Missing Google Maps API key
      </div>
    );
  }

  const position =
    lat !== null && lng !== null ? { lat, lng } : null;

  return (
    <APIProvider apiKey={apiKey}>
      <div style={{ width: "100%", height: "400px" }}>
        <Map
          defaultCenter={position || DEFAULT_CENTER}
          defaultZoom={position ? 19 : 4}
          mapTypeId="hybrid"
          gestureHandling="greedy"
          onClick={(e) => {
            if (readOnly || !onChange) return;

            const coords = e.detail.latLng;
            if (!coords) return;

            onChange({
              lat: coords.lat,
              lng: coords.lng,
            });
          }}
        >
          {position && <Marker position={position} />}
        </Map>
      </div>
    </APIProvider>
  );
}