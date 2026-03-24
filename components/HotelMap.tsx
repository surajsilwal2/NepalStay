"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon broken by webpack
const icon = L.icon({
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize:    [25, 41],
  iconAnchor:  [12, 41],
  popupAnchor: [1, -34],
  shadowSize:  [41, 41],
});

const activeIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize:    [25, 41],
  iconAnchor:  [12, 41],
  popupAnchor: [1, -34],
  shadowSize:  [41, 41],
});

type Hotel = {
  id: string; slug: string; name: string; city: string;
  starRating: number; minPrice: number; latitude: number | null;
  longitude: number | null; avgReview: number | null;
};

type MapHotel = {
  id: string;
  slug: string;
  name: string;
  city: string;
  starRating: number;
  minPrice: number;
  latitude: number | null;
  longitude: number | null;
  avgReview: number | null;
};

interface Props {
  hotels: MapHotel[];
  activeHotelId?: string;
  zoom?: number;
  center?: [number, number];
}

// Nepal center
const NEPAL_CENTER: [number, number] = [28.3949, 84.1240];

export default function HotelMap({ hotels, activeHotelId, zoom = 7, center }: Props) {
  const mapped = hotels.filter(
    (h) => h.latitude !== null && h.longitude !== null,
  );

  // Auto-center on first hotel if only one result
  const mapCenter: [number, number] =
    center ??
    (mapped.length === 1 && mapped[0].latitude && mapped[0].longitude
      ? [mapped[0].latitude, mapped[0].longitude]
      : NEPAL_CENTER);

  const mapZoom = mapped.length === 1 ? 13 : zoom;

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      style={{ width: "100%", height: "100%" }}
      className="rounded-2xl z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mapped.map((hotel) => (
        <Marker
          key={hotel.id}
          position={[hotel.latitude as number, hotel.longitude as number]}
          icon={hotel.id === activeHotelId ? activeIcon : icon}
        >
          <Popup>
            <div className="min-w-[180px]">
              <p className="font-bold text-slate-800 text-sm">{hotel.name}</p>
              <p className="text-slate-500 text-xs mt-0.5">{hotel.city}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-amber-600 font-semibold">
                  {"★".repeat(hotel.starRating)}
                </span>
                {hotel.avgReview && (
                  <span className="text-xs text-green-700 font-semibold">
                    {hotel.avgReview.toFixed(1)} ★
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                from <strong>NPR {hotel.minPrice.toLocaleString()}</strong>
                /night
              </p>
              <Link
                href={`/hotels/${hotel.slug}`}
                className="mt-2 inline-block text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
              >
                View Hotel →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
