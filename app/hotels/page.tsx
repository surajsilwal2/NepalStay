"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  MapPin,
  Star,
  BedDouble,
  SlidersHorizontal,
  X,
  Map,
  Grid3X3,
  Loader2,
  BarChart2,
  GitCompare,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import dynamic from "next/dynamic";
import VoiceSearch from "@/components/features/VoiceSearch";
import SeasonBadge from "@/components/features/SeasonBadge";
import { useCompare } from "@/components/features/CompareContext";

const HotelMap = dynamic(() => import("@/components/HotelMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
    </div>
  ),
});

type Hotel = {
  id: string;
  slug: string;
  name: string;
  city: string;
  address: string;
  starRating: number;
  propertyType: string;
  amenities: string[];
  images: string[];
  latitude: number | null;
  longitude: number | null;
  minPrice: number;
  avgReview: number | null;
  reviewCount: number;
};

const CITIES = [
  "All Cities",
  "Kathmandu",
  "Pokhara",
  "Chitwan",
  "Nagarkot",
  "Lumbini",
  "Bandipur",
];
const PROPERTY_TYPES = [
  "All Types",
  "Hotel",
  "Guesthouse",
  "Resort",
  "Hostel",
  "Lodge",
  "Boutique Hotel",
];
const STAR_OPTIONS = [0, 2, 3, 4, 5];

function HotelCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
      <div className="h-48 bg-slate-200" />
      <div className="p-4 space-y-2">
        <div className="h-5 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-100 rounded w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 bg-slate-200 rounded w-24" />
          <div className="h-8 bg-amber-100 rounded-xl w-24" />
        </div>
      </div>
    </div>
  );
}

function useDebounce<T>(value: T, delay = 400): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

export default function HotelsPage() {
  const { add, remove, isAdded, hotels: compareList } = useCompare();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [view, setView] = useState<"grid" | "map">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [showVoice, setShowVoice] = useState(false);

  // Filters
  const [q, setQ] = useState("");
  const [city, setCity] = useState("All Cities");
  const [type, setType] = useState("All Types");
  const [stars, setStars] = useState(0);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const debouncedQ = useDebounce(q);
  const debouncedMinPrice = useDebounce(minPrice);
  const debouncedMaxPrice = useDebounce(maxPrice);

  const hasFilters =
    city !== "All Cities" ||
    type !== "All Types" ||
    stars > 0 ||
    minPrice ||
    maxPrice;

  const clearFilters = () => {
    setCity("All Cities");
    setType("All Types");
    setStars(0);
    setMinPrice("");
    setMaxPrice("");
    setQ("");
  };

  const buildParams = (pageNum: number) => {
    const params = new URLSearchParams();
    if (debouncedQ && city === "All Cities") params.set("q", debouncedQ);
    if (city !== "All Cities") params.set("city", city);
    if (type !== "All Types") params.set("type", type);
    if (stars > 0) params.set("stars", String(stars));
    if (debouncedMinPrice) params.set("minPrice", debouncedMinPrice);
    if (debouncedMaxPrice) params.set("maxPrice", debouncedMaxPrice);
    params.set("limit", "12");
    params.set("page", String(pageNum));
    return params;
  };

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hotels?${buildParams(1)}`);
      const data = await res.json();
      if (data.success) {
        setHotels(data.data);
        setPage(1);
        setHasMore(data.pagination?.page < data.pagination?.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, city, type, stars, debouncedMinPrice, debouncedMaxPrice]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/hotels?${buildParams(page + 1)}`);
      const data = await res.json();
      if (data.success) {
        setHotels((prev) => [...prev, ...data.data]);
        setPage((p) => p + 1);
        setHasMore(data.pagination?.page < data.pagination?.totalPages);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const inputCls =
    "border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Search bar */}
      <div className="bg-white border-b border-slate-100 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap gap-3 items-center">
          {/* Text search */}
          <div className="flex-1 min-w-[180px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search hotels, cities…"
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={inputCls}
          >
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          {/* Voice search toggle */}
          <button
            onClick={() => setShowVoice((v) => !v)}
            className={`p-2 rounded-xl border transition-colors ${showVoice ? "bg-amber-500 text-white border-amber-500" : "border-slate-200 text-slate-500 hover:border-amber-400"}`}
            title="Voice search"
          >
            🎤
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${hasFilters ? "bg-amber-500 text-white border-amber-500" : "border-slate-200 text-slate-600 hover:border-amber-400"}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters{hasFilters ? ` (active)` : ""}
          </button>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}

          {/* Stats link */}
          <Link
            href="/stats"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-amber-600 rounded-xl hover:bg-amber-50 border border-slate-200 transition-colors"
          >
            <BarChart2 className="w-4 h-4" />
            Stats
          </Link>

          {/* View toggle */}
          <div className="flex rounded-xl border border-slate-200 overflow-hidden ml-auto">
            <button
              onClick={() => setView("grid")}
              className={`px-3 py-2 ${view === "grid" ? "bg-amber-500 text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("map")}
              className={`px-3 py-2 ${view === "map" ? "bg-amber-500 text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <Map className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Voice search panel */}
        {showVoice && (
          <div className="max-w-7xl mx-auto px-4 pb-4 pt-2 border-t border-slate-100 flex items-center justify-center">
            <VoiceSearch
              onResult={(text) => setQ(text)}
              onCity={(detectedCity) => {
                const match = CITIES.find(
                  (c) => c.toLowerCase() === detectedCity.toLowerCase(),
                );
                if (match) setCity(match);
              }}
            />
          </div>
        )}

        {/* Expanded filters */}
        {showFilters && (
          <div className="max-w-7xl mx-auto px-4 pb-3 flex flex-wrap gap-3 border-t border-slate-100 pt-3">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={inputCls}
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Stars:</span>
              {STAR_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStars(stars === s ? 0 : s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${stars === s ? "bg-amber-500 text-white border-amber-500" : "border-slate-200 text-slate-600 hover:border-amber-400"}`}
                >
                  {s === 0 ? "Any" : `${s}★`}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">NPR:</span>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                className={`${inputCls} w-24`}
              />
              <span className="text-slate-300">–</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                className={`${inputCls} w-24`}
              />
            </div>
          </div>
        )}
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">
            {loading
              ? "Searching…"
              : `${hotels.length} hotel${hotels.length !== 1 ? "s" : ""} found`}
            {city !== "All Cities" && ` in ${city}`}
          </p>
          {compareList.length > 0 && (
            <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <GitCompare className="w-3.5 h-3.5" />
              {compareList.length} hotel{compareList.length > 1 ? "s" : ""}{" "}
              selected for comparison
            </p>
          )}
        </div>

        {/* Map view */}
        {view === "map" && (
          <div className="h-[600px] rounded-2xl overflow-hidden border border-slate-200 mb-6">
            <HotelMap hotels={hotels} />
          </div>
        )}

        {/* Grid view */}
        {view === "grid" &&
          (loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <HotelCardSkeleton key={i} />
              ))}
            </div>
          ) : hotels.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
              <BedDouble className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-600">
                No hotels match your search.
              </p>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-3 text-amber-600 text-sm hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {hotels.map((hotel) => (
                  <HotelCard
                    key={hotel.id}
                    hotel={hotel}
                    isInCompare={isAdded(hotel.id)}
                    onCompare={() =>
                      isAdded(hotel.id) ? remove(hotel.id) : add(hotel as any)
                    }
                  />
                ))}
              </div>

              {/* Load more */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:border-amber-400 text-slate-600 hover:text-amber-600 font-medium rounded-xl transition-colors disabled:opacity-60"
                  >
                    {loadingMore ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : null}
                    {loadingMore ? "Loading…" : "Load More Hotels"}
                  </button>
                </div>
              )}
            </>
          ))}
      </main>
    </div>
  );
}

function HotelCard({
  hotel,
  isInCompare,
  onCompare,
}: {
  hotel: Hotel;
  isInCompare: boolean;
  onCompare: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group relative">
      {/* Compare toggle */}
      <button
        onClick={(e) => {
          e.preventDefault();
          onCompare();
        }}
        className={`absolute top-3 left-3 z-10 px-2 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm transition-colors ${
          isInCompare
            ? "bg-amber-500 text-white"
            : "bg-white/90 text-slate-600 hover:bg-amber-50 hover:text-amber-700"
        }`}
      >
        {isInCompare ? "✓ Comparing" : "+ Compare"}
      </button>

      <Link href={`/hotels/${hotel.slug}`} className="block">
        {/* Image */}
        <div className="h-48 relative bg-gradient-to-br from-slate-200 to-slate-300 overflow-hidden">
          {hotel.images?.[0] ? (
            <Image
              src={hotel.images[0]}
              alt={hotel.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width:768px) 100vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BedDouble className="w-10 h-10 text-slate-400" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-slate-700">
              {hotel.propertyType}
            </span>
          </div>
          <div className="absolute bottom-3 right-3 flex">
            {Array.from({ length: hotel.starRating }).map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
            ))}
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-bold text-slate-800 text-base mb-1 line-clamp-1">
            {hotel.name}
          </h3>
          <div className="flex items-center gap-1 text-slate-500 text-sm mb-2">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{hotel.city}</span>
          </div>

          {/* Season badge */}
          <div className="mb-2">
            <SeasonBadge
              basePrice={hotel.minPrice}
              showPriceDiff={false}
              compact
            />
          </div>

          {hotel.avgReview && (
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-lg text-xs font-semibold">
                <Star className="w-3 h-3 fill-green-500 text-green-500" />
                {hotel.avgReview.toFixed(1)}
              </div>
              <span className="text-xs text-slate-400">
                ({hotel.reviewCount} reviews)
              </span>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="text-xs text-slate-400">from</span>
              <span className="text-xl font-bold text-slate-800 ml-1">
                NPR {hotel.minPrice.toLocaleString()}
              </span>
              <span className="text-slate-400 text-xs"> /night</span>
            </div>
            <span className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors">
              View →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
