"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MapPin, Star, Heart, BedDouble, Users, ChevronRight,
  CheckCircle, Shield, Phone, Mail, CalendarDays,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BsDateDisplay from "@/components/BsDateDisplay";
import BookingModal from "@/components/BookingModal";
import { useToast } from "@/components/providers/ToastContext";
import { useSession } from "next-auth/react";

import WeatherWidget      from "@/components/features/WeatherWidget";
import CarbonFootprint    from "@/components/features/CarbonFootprint";
import SeasonBadge        from "@/components/features/SeasonBadge";
import AvailabilityCalendar from "@/components/features/AvailabilityCalendar";
import PriceDisplay       from "@/components/features/PriceDisplay";

const HotelMap = dynamic(() => import("@/components/HotelMap"), { ssr: false,
  loading: () => <div className="h-64 bg-slate-100 animate-pulse rounded-2xl" />,
});

type Room = {
  id: string; name: string; type: string; status: string;
  pricePerNight: number; capacity: number; floor: number;
  description: string | null; amenities: string[]; images: string[];
};
type Review = {
  id: string; overallScore: number; cleanlinessScore: number;
  staffScore: number; locationScore: number; valueScore: number;
  facilitiesScore: number; title: string | null; body: string;
  createdAt: string; user: { name: string; avatar: string | null };
};
type Hotel = {
  id: string; name: string; slug: string; description: string;
  city: string; address: string; starRating: number; propertyType: string;
  amenities: string[]; images: string[]; latitude: number | null;
  longitude: number | null; contactPhone: string | null; contactEmail: string | null;
  policies: any; rooms: Room[]; reviews: Review[];
  avgReview: { overall: number; cleanliness: number; staff: number; location: number; value: number; facilities: number; } | null;
  isWishlisted: boolean; _count: { reviews: number };
  recommendations: any[];
};

const SCORE_LABELS = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "staff",       label: "Staff" },
  { key: "location",    label: "Location" },
  { key: "value",       label: "Value" },
  { key: "facilities",  label: "Facilities" },
] as const;

export default function HotelDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: session } = useSession();
  const { success: toastSuccess, error: toastError } = useToast();

  const [hotel, setHotel]         = useState<Hotel | null>(null);
  const [loading, setLoading]     = useState(true);
  const [wishlisted, setWishlisted] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [calendarRoomId, setCalendarRoomId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/hotels/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setHotel(d.data);
          setWishlisted(d.data.isWishlisted);
          const firstAvailable = (d.data.rooms as Room[]).find(
            (r) => r.status === "AVAILABLE",
          );
          if (firstAvailable) setCalendarRoomId(firstAvailable.id);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const toggleWishlist = async () => {
    if (!session) { toastError("Sign in to save hotels"); return; }
    const res  = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hotelId: hotel!.id }),
    });
    const data = await res.json();
    if (data.success) {
      setWishlisted(data.data.wishlisted);
      toastSuccess(data.data.wishlisted ? "Added to wishlist" : "Removed from wishlist");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-4 animate-pulse">
          <div className="h-72 bg-slate-200 rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-72 bg-slate-100 rounded-2xl" />
            <div className="h-72 bg-slate-100 rounded-2xl" />
            <div className="h-72 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="text-center py-24">
          <p className="text-slate-500">Hotel not found.</p>
          <Link href="/hotels" className="text-amber-600 hover:underline mt-2 inline-block">← Browse hotels</Link>
        </div>
      </div>
    );
  }

  const mainImages = hotel.images.length > 0 ? hotel.images : [null];

  const mapHotel = {
    id: hotel.id,
    slug: hotel.slug,
    name: hotel.name,
    city: hotel.city,
    starRating: hotel.starRating,
    latitude: hotel.latitude,
    longitude: hotel.longitude,
    minPrice: hotel.rooms[0]?.pricePerNight ?? 0,
    avgReview: hotel.avgReview?.overall ?? null,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
          <Link href="/hotels" className="hover:text-amber-600">
            Hotels
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>{hotel.city}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-600">{hotel.name}</span>
        </div>

        {/* Image gallery */}
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-80 rounded-2xl overflow-hidden mb-8">
          <div className="col-span-2 row-span-2 relative bg-slate-200">
            {hotel.images[0] ? (
              <Image
                src={hotel.images[activeImg] ?? hotel.images[0]}
                alt={hotel.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BedDouble className="w-12 h-12 text-slate-400" />
              </div>
            )}
          </div>
          {hotel.images.slice(1, 5).map((img, i) => (
            <div
              key={i}
              className="relative bg-slate-200 cursor-pointer"
              onClick={() => setActiveImg(i + 1)}
            >
              <Image
                src={img}
                alt={`${hotel.name} ${i + 2}`}
                fill
                className="object-cover hover:brightness-110 transition-all"
              />
            </div>
          ))}
          {hotel.images.length < 5 &&
            Array.from({ length: 4 - (hotel.images.length - 1) }).map(
              (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="bg-slate-100 flex items-center justify-center"
                >
                  <BedDouble className="w-6 h-6 text-slate-300" />
                </div>
              ),
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left — main info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      {hotel.propertyType}
                    </span>
                    <div className="flex">
                      {Array.from({ length: hotel.starRating }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold text-slate-800">
                    {hotel.name}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {hotel.address}, {hotel.city}
                    </span>
                  </div>
                  <div className="mt-2">
                    <SeasonBadge
                      basePrice={hotel.rooms[0]?.pricePerNight ?? 0}
                      showPriceDiff
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={toggleWishlist}
                    className={`p-2.5 rounded-xl border transition-colors ${
                      wishlisted
                        ? "bg-red-50 border-red-200 text-red-500"
                        : "border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-400"
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 ${wishlisted ? "fill-red-500" : ""}`}
                    />
                  </button>
                </div>
              </div>

              {/* Overall score */}
              {hotel.avgReview && (
                <div className="mt-4 flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100 w-fit">
                  <div className="text-3xl font-bold text-green-700">
                    {hotel.avgReview.overall.toFixed(1)}
                  </div>
                  <div>
                    <p className="font-semibold text-green-800 text-sm">
                      {hotel.avgReview.overall >= 4.5
                        ? "Exceptional"
                        : hotel.avgReview.overall >= 4
                          ? "Excellent"
                          : hotel.avgReview.overall >= 3.5
                            ? "Very Good"
                            : "Good"}
                    </p>
                    <p className="text-xs text-green-600">
                      {hotel._count.reviews} verified reviews
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">
                About this property
              </h2>
              <p className="text-slate-600 leading-relaxed">
                {hotel.description}
              </p>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">
                Amenities
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {hotel.amenities.map((a) => (
                  <div
                    key={a}
                    className="flex items-center gap-2 text-sm text-slate-600"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {a}
                  </div>
                ))}
              </div>
            </div>
            <CarbonFootprint
              nights={1}
              propertyType={hotel.propertyType}
              city={hotel.city}
              guestCount={2}
            />

            {/* Rooms */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">
                Available Rooms
              </h2>
              <div className="space-y-3">
                {hotel.rooms
                  .filter((r) => r.status === "AVAILABLE")
                  .map((room) => (
                    <div
                      key={room.id}
                      className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between gap-4 hover:border-amber-200 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-800">
                            {room.name}
                          </h3>
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {room.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            Up to {room.capacity}
                          </span>
                          <span>Floor {room.floor}</span>
                        </div>
                        {room.description && (
                          <p className="text-xs text-slate-400 mb-2 line-clamp-1">
                            {room.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {room.amenities.slice(0, 4).map((a) => (
                            <span
                              key={a}
                              className="text-xs bg-slate-50 border border-slate-100 text-slate-500 px-2 py-0.5 rounded"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <PriceDisplay
                          amountNPR={room.pricePerNight}
                          className="mb-1"
                        />
                        <SeasonBadge
                          basePrice={room.pricePerNight}
                          showPriceDiff
                          compact
                        />
                        <div className="flex items-center gap-2 mt-2 justify-end">
                          <button
                            onClick={() =>
                              setCalendarRoomId(
                                calendarRoomId === room.id ? null : room.id,
                              )
                            }
                            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                              calendarRoomId === room.id
                                ? "bg-amber-50 border-amber-300 text-amber-700"
                                : "border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-600"
                            }`}
                          >
                            <CalendarDays className="w-3 h-3" />
                            Availability
                          </button>
                          <button
                            onClick={() => setSelectedRoom(room)}
                            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all"
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                {hotel.rooms.filter((r) => r.status === "AVAILABLE").length ===
                  0 && (
                  <div className="text-center py-10 bg-white rounded-2xl border border-slate-100">
                    <BedDouble className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500">
                      No rooms available right now.
                    </p>
                  </div>
                )}
              </div>
              {calendarRoomId && (
                <div className="mt-3">
                  <AvailabilityCalendar
                    roomId={calendarRoomId}
                    roomName={
                      hotel.rooms.find((r) => r.id === calendarRoomId)?.name
                    }
                  />
                </div>
              )}
            </div>

            {/* Review breakdown */}
            {hotel.avgReview && (
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4">
                  Guest Reviews ({hotel._count.reviews})
                </h2>
                {/* Score breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {SCORE_LABELS.map(({ key, label }) => (
                    <div
                      key={key}
                      className="bg-white rounded-xl border border-slate-100 p-3"
                    >
                      <p className="text-xs text-slate-400 mb-1">{label}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{
                              width: `${(hotel.avgReview![key] / 5) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-bold text-slate-700">
                          {hotel.avgReview![key].toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Individual reviews */}
                <div className="space-y-4">
                  {hotel.reviews.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white rounded-2xl border border-slate-100 p-5"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {r.user.avatar ? (
                            <Image
                              src={r.user.avatar}
                              alt={r.user.name}
                              width={36}
                              height={36}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700">
                              {r.user.name[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-sm text-slate-800">
                              {r.user.name}
                            </p>
                            <BsDateDisplay
                              date={r.createdAt}
                              className="text-xs text-slate-400"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg text-sm font-bold">
                          <Star className="w-3.5 h-3.5 fill-green-500 text-green-500" />
                          {r.overallScore.toFixed(1)}
                        </div>
                      </div>
                      {r.title && (
                        <p className="font-semibold text-slate-700 mb-1">
                          {r.title}
                        </p>
                      )}
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {r.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            {hotel.latitude && hotel.longitude && (
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4">
                  Location
                </h2>
                <div className="h-64 rounded-2xl overflow-hidden border border-slate-200">
                  <HotelMap
                    hotels={[mapHotel]}
                    activeHotelId={hotel.id}
                    zoom={14}
                    center={
                      hotel.latitude && hotel.longitude
                        ? [hotel.latitude, hotel.longitude]
                        : undefined
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right — sticky sidebar */}
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {/* Contact card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="font-bold text-slate-800 mb-3">Contact Hotel</h3>
              <div className="space-y-2">
                {hotel.contactPhone && (
                  <a
                    href={`tel:${hotel.contactPhone}`}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-amber-600 transition-colors"
                  >
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    {hotel.contactPhone}
                  </a>
                )}
                {hotel.contactEmail && (
                  <a
                    href={`mailto:${hotel.contactEmail}`}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-amber-600 transition-colors"
                  >
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    {hotel.contactEmail}
                  </a>
                )}
              </div>

              {hotel.policies && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Policies
                  </p>
                  {hotel.policies.checkIn && (
                    <p className="text-xs text-slate-500">
                      Check-in: <strong>{hotel.policies.checkIn}</strong>
                    </p>
                  )}
                  {hotel.policies.checkOut && (
                    <p className="text-xs text-slate-500">
                      Check-out: <strong>{hotel.policies.checkOut}</strong>
                    </p>
                  )}
                  {hotel.policies.cancellation && (
                    <p className="text-xs text-slate-500">
                      {hotel.policies.cancellation}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 p-3 bg-green-50 rounded-xl text-xs text-green-700 flex items-center gap-2">
                <Shield className="w-4 h-4 flex-shrink-0" />
                Booking protected by NepalStay guarantee
              </div>
            </div>
            <WeatherWidget city={hotel.city} />
          </div>
        </div>

        {/* Recommendations */}
        {hotel.recommendations.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              Similar Hotels You Might Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {hotel.recommendations.map((rec: any) => (
                <Link
                  key={rec.id}
                  href={`/hotels/${rec.slug}`}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group"
                >
                  <div className="h-36 relative bg-slate-200 overflow-hidden">
                    {rec.images?.[0] ? (
                      <Image
                        src={rec.images[0]}
                        alt={rec.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BedDouble className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-slate-800 text-sm line-clamp-1">
                      {rec.name}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {rec.city}
                    </p>
                    <p className="text-sm font-semibold text-amber-600 mt-1">
                      from NPR {Math.round(rec.avgPrice).toLocaleString()}/night
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {selectedRoom && (
        <BookingModal
          room={selectedRoom}
          hotel={{ id: hotel.id, name: hotel.name, slug: hotel.slug }}
          onClose={() => setSelectedRoom(null)}
          onSuccess={() => {
            setSelectedRoom(null);
          }}
        />
      )}
    </div>
  );
}
