"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Loader2, CheckCircle, AlertCircle, Clock, MapPin, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/providers/ToastContext";
import { UploadButton } from "@/lib/uploadthing-components";
import Image from "next/image";

const CITIES        = ["Kathmandu","Pokhara","Chitwan","Nagarkot","Lumbini","Janakpur","Butwal","Dharan","Bharatpur","Hetauda","Other"];
const PROPERTY_TYPES = ["Hotel","Guesthouse","Resort","Hostel","Lodge","Boutique Hotel"];
const COMMON_AMENITIES = ["WiFi","Parking","Restaurant","Bar","Pool","Gym","Spa","AC","24h Reception","Airport Transfer","Laundry","Mountain View","Garden"];

const schema = z.object({
  name:         z.string().min(3, "Hotel name must be at least 3 characters"),
  description:  z.string().min(20, "Description must be at least 20 characters"),
  city:         z.string().min(1),
  address:      z.string().min(5, "Please enter a full address"),
  latitude:     z.coerce.number().optional(),
  longitude:    z.coerce.number().optional(),
  starRating:   z.coerce.number().int().min(1).max(5),
  propertyType: z.string(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  website:      z.string().optional(),
  checkIn:      z.string().default("14:00"),
  checkOut:     z.string().default("11:00"),
  cancellation: z.string().optional(),
});
type HotelForm = z.infer<typeof schema>;

const STATUS_INFO: Record<string, { icon: any; cls: string; text: string }> = {
  PENDING:   { icon: Clock,         cls: "bg-amber-50 border-amber-200 text-amber-700",  text: "Your hotel listing is under review by our admin team." },
  APPROVED:  { icon: CheckCircle,   cls: "bg-green-50 border-green-200 text-green-700",  text: "Your hotel is live and accepting bookings." },
  REJECTED:  { icon: AlertCircle,   cls: "bg-red-50 border-red-200 text-red-700",        text: "Your listing was rejected. Please update and resubmit." },
  SUSPENDED: { icon: AlertCircle,   cls: "bg-orange-50 border-orange-200 text-orange-700",text: "Your listing is suspended. Contact admin for details." },
};

export default function VendorHotelPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [hotel, setHotel]         = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [images, setImages]       = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [saving, setSaving]       = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<HotelForm>({ resolver: zodResolver(schema), defaultValues: { starRating: 3, propertyType: "Hotel" } });

  useEffect(() => {
    fetch("/api/vendor/hotel").then(r => r.json()).then(d => {
      if (d.success && d.data) {
        const h = d.data;
        setHotel(h);
        setImages(h.images ?? []);
        setAmenities(h.amenities ?? []);
        reset({
          name: h.name, description: h.description, city: h.city, address: h.address,
          latitude: h.latitude ?? undefined, longitude: h.longitude ?? undefined,
          starRating: h.starRating, propertyType: h.propertyType,
          contactPhone: h.contactPhone ?? "", contactEmail: h.contactEmail ?? "",
          website: h.website ?? "",
          checkIn:      h.policies?.checkIn ?? "14:00",
          checkOut:     h.policies?.checkOut ?? "11:00",
          cancellation: h.policies?.cancellation ?? "",
        });
      }
    }).finally(() => setLoading(false));
  }, [reset]);

  const toggleAmenity = (a: string) => {
    setAmenities(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a]);
  };

  const onSubmit = async (data: HotelForm) => {
    setSaving(true);
    const payload = {
      name: data.name, description: data.description, city: data.city, address: data.address,
      latitude: data.latitude, longitude: data.longitude,
      starRating: Number(data.starRating), propertyType: data.propertyType,
      amenities, images,
      contactPhone: data.contactPhone || undefined,
      contactEmail: data.contactEmail || undefined,
      website:      data.website || undefined,
      policies: { checkIn: data.checkIn, checkOut: data.checkOut, cancellation: data.cancellation },
    };
    const method = hotel ? "PUT" : "POST";
    const res    = await fetch("/api/vendor/hotel", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json   = await res.json();
    setSaving(false);
    if (!json.success) { toastError(json.error); return; }
    toastSuccess(hotel ? "Hotel updated successfully" : "Hotel submitted for approval!");
    if (!hotel) setHotel(json.data);
  };

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">
          {hotel ? "Edit Hotel Listing" : "Create Hotel Listing"}
        </h1>

        {/* Status banner */}
        {hotel?.status && (() => {
          const cfg = STATUS_INFO[hotel.status];
          if (!cfg) return null;
          return (
            <div className={`flex items-center gap-3 p-4 rounded-2xl border mb-6 ${cfg.cls}`}>
              <cfg.icon className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">{hotel.status}</p>
                <p className="text-xs mt-0.5">{cfg.text}</p>
                {hotel.rejectionReason && (
                  <p className="text-xs mt-1 font-medium">Reason: {hotel.rejectionReason}</p>
                )}
              </div>
            </div>
          );
        })()}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic info */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
            <h2 className="font-bold text-slate-800">Basic Information</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Hotel Name *</label>
              <input {...register("name")} placeholder="e.g. Himalayan Heritage Hotel" className={inputCls} />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description *</label>
              <textarea {...register("description")} rows={4} placeholder="Describe your hotel, its unique features, nearby attractions…"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500" />
              {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Property Type</label>
                <select {...register("propertyType")} className={inputCls}>
                  {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Star Rating</label>
                <select {...register("starRating")} className={inputCls}>
                  {[1,2,3,4,5].map(s => <option key={s} value={s}>{"★".repeat(s)} ({s} Star{s > 1 ? "s" : ""})</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2"><MapPin className="w-4 h-4 text-amber-500" />Location</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">City *</label>
                <select {...register("city")} className={inputCls}>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Address *</label>
                <input {...register("address")} placeholder="Street, Ward, Municipality" className={inputCls} />
                {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Latitude <span className="font-normal text-slate-400 text-xs">(for map pin)</span>
                </label>
                <input {...register("latitude")} type="number" step="0.0001" placeholder="e.g. 27.7172" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Longitude</label>
                <input {...register("longitude")} type="number" step="0.0001" placeholder="e.g. 85.3240" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-bold text-slate-800 mb-4">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {COMMON_AMENITIES.map(a => (
                <button key={a} type="button" onClick={() => toggleAmenity(a)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                    amenities.includes(a)
                      ? "bg-amber-500 text-white border-amber-500"
                      : "border-slate-200 text-slate-600 hover:border-amber-300"
                  }`}>
                  {a}
                </button>
              ))}
            </div>
            {amenities.length > 0 && (
              <p className="mt-3 text-xs text-slate-400">{amenities.length} amenity/ies selected</p>
            )}
          </div>

          {/* Photos */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="font-bold text-slate-800 mb-4">Photos</h2>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {images.map((img, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden group">
                    <Image src={img} alt={`Hotel ${i+1}`} fill className="object-cover" />
                    <button type="button" onClick={() => setImages(p => p.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <UploadButton
              endpoint="hotelImage"
              onClientUploadComplete={(res) => {
                const urls = res.map(f => f.url);
                setImages(p => [...p, ...urls]);
                toastSuccess(`${urls.length} photo${urls.length > 1 ? "s" : ""} uploaded`);
              }}
              onUploadError={(err) => toastError(err.message)}
            />
          </div>

          {/* Contact & Policies */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
            <h2 className="font-bold text-slate-800">Contact & Policies</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                <input {...register("contactPhone")} type="tel" placeholder="+977-01-XXXXXXX" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input {...register("contactEmail")} type="email" placeholder="info@yourhotel.com" className={inputCls} />
                {errors.contactEmail && <p className="mt-1 text-xs text-red-600">{errors.contactEmail.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Check-in Time</label>
                <input {...register("checkIn")} type="time" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Check-out Time</label>
                <input {...register("checkOut")} type="time" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Cancellation Policy</label>
              <input {...register("cancellation")} placeholder="e.g. Free cancellation up to 48 hours before check-in" className={inputCls} />
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60 text-base">
            {saving
              ? <><Loader2 className="w-5 h-5 animate-spin" />Saving…</>
              : hotel ? "Save Changes" : "Submit for Approval"
            }
          </button>
        </form>
      </main>
    </div>
  );
}
