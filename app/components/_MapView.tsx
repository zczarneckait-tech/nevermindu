"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker1x from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";


type PublicPost = {
  id: string;
  content: string;
  city: string | null;
  lat: number;
  lng: number;
  created_at: string;
};




export default function MapView({
  center,
  posts,
}: {
  center: [number, number];
  posts: PublicPost[];
}) {const emojiIcon = L.divIcon({
  html: "📍",
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

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

      {posts
  .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
  .map((p) => (
    <Marker key={p.id} position={[p.lat, p.lng]} icon={emojiIcon}>

      {/* HOVER */}
      <Tooltip direction="top" offset={[0, -10]} opacity={0.95} sticky>
        <div style={{ maxWidth: 220 }}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            {p.city ?? "Unknown city"}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: "pre-wrap",
            }}
          >
            {p.content.length > 120
              ? p.content.slice(0, 120) + "…"
              : p.content}
          </div>
        </div>
      </Tooltip>

      {/* KLIK */}
      <Popup>
        <div style={{ maxWidth: 260 }}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            {p.city ?? "Unknown city"} •{" "}
            {new Date(p.created_at).toLocaleString()}
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
