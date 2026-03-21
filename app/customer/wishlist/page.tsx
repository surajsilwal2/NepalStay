"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, BedDouble, MapPin, Star, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/providers/ToastContext";

export default function WishlistPage() {
  const { success: toastSuccess } = useToast();
  const [items, setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    const res  = await fetch("/api/wishlist");
    const data = await res.json();
    if (data.success) setItems(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchWishlist(); }, []);

  const removeFromWishlist = async (hotelId: string) => {
    await fetch("/api/wishlist", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hotelId }),
    });
    toastSuccess("Removed from wishlist");
    setItems((p) => p.filter((i) => i.hotel.id !== hotelId));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Heart className="w-6 h-6 text-red-500" />
          <h1 className="text-2xl font-bold text-slate-800">Saved Hotels</h1>
          {!loading && <span className="text-sm text-slate-400">({items.length})</span>}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-600">No saved hotels yet</p>
            <Link href="/hotels" className="mt-3 inline-block text-amber-600 text-sm hover:underline">
              Browse hotels →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => {
              const h = item.hotel;
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden group">
                  <div className="h-40 relative bg-slate-200">
                    {h.images?.[0] ? (
                      <Image src={h.images[0]} alt={h.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="33vw" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BedDouble className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    <button onClick={() => removeFromWishlist(h.id)}
                      className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors">
                      <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                    </button>
                    <div className="absolute top-3 left-3 flex">
                      {Array.from({ length: h.starRating }).map((_: any, i: number) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <div className="p-4">
                    <Link href={`/hotels/${h.slug}`} className="font-bold text-slate-800 hover:text-amber-600 line-clamp-1 block">
                      {h.name}
                    </Link>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />{h.city}
                    </p>
                    {h.avgReview && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-semibold">
                          ★ {h.avgReview.toFixed(1)}
                        </span>
                        <span className="text-xs text-slate-400">({h.reviewCount})</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm font-bold text-amber-600">
                        from NPR {h.minPrice.toLocaleString()}<span className="font-normal text-slate-400 text-xs">/night</span>
                      </p>
                      <Link href={`/hotels/${h.slug}`}
                        className="text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600">
                        View →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
