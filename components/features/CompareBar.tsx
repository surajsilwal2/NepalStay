"use client";
import { useCompare } from "./CompareContext";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  BarChart2,
  Star,
  BedDouble,
  CheckCircle,
  XCircle,
} from "lucide-react";

const ALL_AMENITIES = [
  "WiFi",
  "Parking",
  "Restaurant",
  "Bar",
  "Pool",
  "Gym",
  "Spa",
  "AC",
  "Mountain View",
  "Garden",
  "Fireplace",
  "Balcony",
];

export default function CompareBar() {
  const { hotels, remove, clear, isOpen, setOpen } = useCompare();

  if (hotels.length === 0) return null;

  return (
    <>
      {/* Floating bar at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-2xl">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <BarChart2 className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-slate-700">
              Compare Hotels ({hotels.length}/3)
            </span>
          </div>

          {/* Hotel thumbnails */}
          <div className="flex items-center gap-3">
            {hotels.map((h) => (
              <div
                key={h.id}
                className="relative flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-1.5"
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                  {h.images?.[0] ? (
                    <Image
                      src={h.images[0]}
                      alt={h.name}
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <BedDouble className="w-4 h-4 text-slate-400 m-auto mt-2" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate max-w-[100px]">
                    {h.name}
                  </p>
                  <p className="text-xs text-slate-400">{h.city}</p>
                </div>
                <button
                  onClick={() => remove(h.id)}
                  className="w-4 h-4 bg-slate-200 hover:bg-red-100 rounded-full flex items-center justify-center ml-1"
                >
                  <X className="w-2.5 h-2.5 text-slate-500" />
                </button>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: 3 - hotels.length }).map((_, i) => (
              <div
                key={i}
                className="w-32 h-12 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center"
              >
                <p className="text-xs text-slate-300">+ Add hotel</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {hotels.length >= 2 && (
              <button
                onClick={() => setOpen(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Compare Now
              </button>
            )}
            <button
              onClick={clear}
              className="px-3 py-2 border border-slate-200 text-slate-500 text-sm rounded-xl hover:bg-slate-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-start justify-center pt-8 px-4 pb-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-bold text-slate-800">
                  Hotel Comparison
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-slate-500 w-36 bg-slate-50">
                      Feature
                    </th>
                    {hotels.map((h) => (
                      <th
                        key={h.id}
                        className="p-4 bg-slate-50 text-center min-w-[200px]"
                      >
                        <div className="h-32 relative rounded-xl overflow-hidden mb-3 bg-slate-200">
                          {h.images?.[0] && (
                            <Image
                              src={h.images[0]}
                              alt={h.name}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <p className="font-bold text-slate-800 text-sm">
                          {h.name}
                        </p>
                        <p className="text-xs text-slate-400">{h.city}</p>
                        <Link
                          href={`/hotels/${h.slug}`}
                          className="mt-2 inline-block text-xs px-3 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                        >
                          View Hotel
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {/* Stars */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-4 text-sm font-medium text-slate-600">
                      Star Rating
                    </td>
                    {hotels.map((h) => (
                      <td key={h.id} className="p-4 text-center">
                        <div className="flex justify-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < h.starRating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                            />
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Type */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-4 text-sm font-medium text-slate-600">
                      Property Type
                    </td>
                    {hotels.map((h) => (
                      <td
                        key={h.id}
                        className="p-4 text-center text-sm text-slate-700"
                      >
                        {h.propertyType}
                      </td>
                    ))}
                  </tr>

                  {/* Price */}
                  <tr className="hover:bg-slate-50/50 bg-amber-50/30">
                    <td className="p-4 text-sm font-semibold text-slate-700">
                      Price / Night
                    </td>
                    {hotels.map((h) => {
                      const best = Math.min(...hotels.map((x) => x.minPrice));
                      const isBest = h.minPrice === best;
                      return (
                        <td key={h.id} className="p-4 text-center">
                          <p
                            className={`font-bold text-lg ${isBest ? "text-green-600" : "text-slate-800"}`}
                          >
                            NPR {h.minPrice.toLocaleString()}
                          </p>
                          {isBest && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              Best Price
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Review */}
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-4 text-sm font-medium text-slate-600">
                      Guest Rating
                    </td>
                    {hotels.map((h) => (
                      <td key={h.id} className="p-4 text-center">
                        {h.avgReview ? (
                          <div>
                            <div className="flex items-center justify-center gap-1">
                              <Star className="w-4 h-4 fill-green-500 text-green-500" />
                              <span className="font-bold text-slate-800">
                                {h.avgReview.toFixed(1)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              {h.reviewCount} reviews
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            No reviews yet
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Amenities */}
                  {ALL_AMENITIES.map((amenity) => (
                    <tr key={amenity} className="hover:bg-slate-50/50">
                      <td className="p-4 text-sm text-slate-600">{amenity}</td>
                      {hotels.map((h) => (
                        <td key={h.id} className="p-4 text-center">
                          {h.amenities.includes(amenity) ? (
                            <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-slate-200 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
