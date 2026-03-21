"use client";
import { useEffect, useState } from "react";
import { Star, Eye, EyeOff, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import BsDateDisplay from "@/components/BsDateDisplay";
import { useToast } from "@/components/providers/ToastContext";

type Review = {
  id: string; overallScore: number; title: string | null; body: string;
  isVisible: boolean; createdAt: string;
  user:  { name: string; email: string };
  hotel: { name: string; city: string; slug: string };
};

export default function AdminReviewsPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<"all" | "visible" | "hidden">("all");
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    const url = filter === "visible"
      ? "/api/admin/reviews?visible=true"
      : filter === "hidden"
      ? "/api/admin/reviews?visible=false"
      : "/api/admin/reviews";
    const res  = await fetch(url);
    const data = await res.json();
    if (data.success) setReviews(data.data);
    else toastError("Failed to load reviews");
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, [filter]);

  const toggleVisibility = async (id: string, currentlyVisible: boolean, guestName: string) => {
    setToggling(id);
    const res  = await fetch("/api/admin/reviews", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isVisible: !currentlyVisible }),
    });
    const data = await res.json();
    setToggling(null);
    if (data.success) {
      toastSuccess(currentlyVisible ? `Review by ${guestName} hidden` : `Review by ${guestName} made visible`);
      fetchReviews();
    } else toastError(data.error);
  };

  const visible = reviews.filter(r => r.isVisible).length;
  const hidden  = reviews.filter(r => !r.isVisible).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Review Moderation</h1>
            <p className="text-slate-500 mt-1 text-sm">{reviews.length} reviews · {visible} visible · {hidden} hidden</p>
          </div>
          <button onClick={fetchReviews}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            <RefreshCw className="w-4 h-4" />Refresh
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {(["all","visible","hidden"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                filter === f ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
              }`}>
              {f} ({f === "all" ? reviews.length : f === "visible" ? visible : hidden})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl h-28 border border-slate-100"/>)}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <Star className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No reviews in this category.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(review => (
              <div key={review.id}
                className={`bg-white rounded-2xl border overflow-hidden transition-opacity ${
                  review.isVisible ? "border-slate-100" : "border-slate-200 opacity-60"
                }`}>
                <div className="p-5 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-800 text-sm">{review.user.name}</p>
                          <span className="text-xs text-slate-400">→</span>
                          <Link href={`/hotels/${review.hotel.slug}`}
                            className="text-sm font-medium text-amber-600 hover:underline">
                            {review.hotel.name}
                          </Link>
                          <span className="text-xs text-slate-400">{review.hotel.city}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-bold">
                            <Star className="w-3 h-3 fill-green-500 text-green-500" />
                            {review.overallScore.toFixed(1)}
                          </div>
                          <BsDateDisplay date={review.createdAt} className="text-xs text-slate-400" />
                        </div>
                      </div>
                      {!review.isVisible && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                          Hidden
                        </span>
                      )}
                    </div>
                    {review.title && <p className="font-semibold text-slate-700 text-sm mb-1">{review.title}</p>}
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{review.body}</p>
                  </div>

                  <button
                    onClick={() => toggleVisibility(review.id, review.isVisible, review.user.name)}
                    disabled={toggling === review.id}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border font-medium flex-shrink-0 transition-colors disabled:opacity-50 ${
                      review.isVisible
                        ? "border-red-200 text-red-600 hover:bg-red-50"
                        : "border-green-200 text-green-700 hover:bg-green-50"
                    }`}>
                    {review.isVisible
                      ? <><EyeOff className="w-3.5 h-3.5" />Hide</>
                      : <><Eye className="w-3.5 h-3.5" />Show</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
