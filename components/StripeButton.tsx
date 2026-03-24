"use client";
import { useState } from "react";
import { CreditCard, Loader2, ExternalLink } from "lucide-react";

interface Props {
  bookingId: string;
  amount: number; // NPR
}

export default function StripeButton({ bookingId, amount }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payment/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to initiate payment");
        setLoading(false);
        return;
      }

      // Redirect to Stripe Checkout — same tab, Stripe redirects back on success
      window.location.href = data.data.url;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  // Approx USD shown alongside NPR for transparency
  const approxUSD = (amount / 133).toFixed(2);

  return (
    <div className="space-y-1.5">
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold rounded-xl transition-all text-sm disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CreditCard className="w-4 h-4" />
        )}
        {loading
          ? "Redirecting to Stripe…"
          : `Pay NPR ${amount.toLocaleString()} (~$${approxUSD} USD)`}
        {!loading && <ExternalLink className="w-3 h-3 opacity-60" />}
      </button>
      <p className="text-xs text-slate-400 text-center">
        Secured by Stripe · Visa · Mastercard · Amex · Any country
      </p>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}
