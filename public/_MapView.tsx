"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

type PublicPost = {
  id: string;
  content: string;
  city: string | null;
  lat: number;
  lng: number;
  created_at: string;
};

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapView({
  center,
  posts,
}: {
  center: [number, number];
  posts: PublicPost[];
}) {
  return (
    <MapContainer
      center={center}
      zoom={3}
      style={{ height: "70vh", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {posts.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]}>
          <Popup>
            <div style={{ maxWidth: 260 }}>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                {p.city ?? "Unknown city"} • {new Date(p.created_at).toLocaleString()}
              </div>
              <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>
                {p.content}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
