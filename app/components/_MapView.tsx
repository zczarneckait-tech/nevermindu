"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import { useMemo } from "react";
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
}) {
  const emojiIcon = L.divIcon({
  html: "📍",
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

// 1) grupowanie postów po lokalizacji
const groups = useMemo(() => {
  const map = new Map<string, PublicPost[]>();

  for (const p of posts) {
    const lat = Number(p.lat);
    const lng = Number(p.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    // klucz "miejsce" (u Ciebie i tak zwykle 2 miejsca po przecinku)
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;

    const arr = map.get(key) ?? [];
    arr.push({ ...p, lat, lng });
    map.set(key, arr);
  }

  // zamień na tablicę grup, posortuj w każdej grupie od najnowszych
  const out = Array.from(map.entries()).map(([key, arr]) => {
    arr.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return { key, lat: arr[0].lat, lng: arr[0].lng, posts: arr };
  });

  return out;
}, [posts]);


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

      {groups.map((g) => {
  const latest3 = g.posts.slice(0, 3);

  return (
    <Marker key={g.key} position={[g.lat, g.lng]} icon={emojiIcon}>

      {/* HOVER – 3 ostatnie wiadomości */}
      <Tooltip direction="top" offset={[0, -12]} opacity={1} sticky className="nm-tooltip">
  <div className="nm-thread">
    {latest3.map((p) => (
      <div key={p.id} className="nm-bubble">
        <div className="nm-text">{p.content}</div>
        <div className="nm-meta">
          {new Date(p.created_at).toLocaleString()}
        </div>
      </div>
    ))}
  </div>
</Tooltip>


      {/* KLIK – pełna lista */}
      <Popup>
        <div style={{ maxWidth: 280 }}>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
            {latest3[0]?.city ?? "Unknown city"}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {g.posts.map((p) => (
              <div key={p.id}>
                <div style={{ fontSize: 11, opacity: 0.7 }}>
                  {new Date(p.created_at).toLocaleString()}
                </div>
                <div style={{ whiteSpace: "pre-wrap" }}>{p.content}</div>
              </div>
            ))}
          </div>
        </div>
      </Popup>
    </Marker>
  );
})}


    </MapContainer>
  );
}
