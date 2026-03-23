"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import Link from "next/link";

// ── Inner component — reads URL params and calls verify ───────────────────────
function StripeVerifier() {
  const searchParams = useSearchParams();

  type Status = "loading" | "success" | "error";
  const [status, setStatus] = useState<Status>("loading");
  const [invoice, setInvoice] = useState("");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const bookingId = searchParams.get("bookingId");

    // Both params must be present — Stripe puts them in the success_url
    if (!sessionId || !bookingId) {
      setStatus("error");
      setErrMsg(
        "Missing payment details in URL. Please check your bookings page to confirm status.",
      );
      return;
    }

    // Call verify — this is the single source of truth
    // It confirms with Stripe, updates the booking, and issues the invoice
    fetch("/api/payment/stripe/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, bookingId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setInvoice(data.data.invoiceNumber);
          setStatus("success");
        } else {
          setStatus("error");
          setErrMsg(data.error || "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrMsg(
          "Network error during verification. Please check your bookings page.",
        );
      });
  }, [searchParams]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 max-w-md w-full text-center">
        <Loader2 className="w-14 h-14 animate-spin text-blue-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800">
          Confirming your payment…
        </h2>
        <p className="text-slate-500 mt-2 text-sm">
          Please wait. Do not close this tab.
        </p>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 max-w-md w-full text-center">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">
          Payment Successful!
        </h2>
        <p className="text-slate-500 mt-2 text-sm">
          Your booking is confirmed. A receipt has been saved to your account.
        </p>

        {invoice && (
          <div className="mt-5 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">
              Invoice Number
            </p>
            <p className="text-xl font-bold text-green-700 font-mono mt-1">
              {invoice}
            </p>
            <p className="text-xs text-green-600 mt-1">
              IRD-compliant invoice issued
            </p>
          </div>
        )}

        <Link
          href="/customer/bookings"
          className="mt-6 inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
        >
          View My Bookings →
        </Link>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 max-w-md w-full text-center">
      <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-slate-800">Verification Failed</h2>
      <p className="text-slate-500 mt-2 text-sm">{errMsg}</p>
      <div className="mt-6 space-y-2">
        <Link
          href="/customer/bookings"
          className="block px-6 py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors"
        >
          Check My Bookings
        </Link>
        <p className="text-xs text-slate-400">
          If your card was charged, your booking will appear in your bookings
          page. Contact support if it does not appear within 10 minutes.
        </p>
      </div>
    </div>
  );
}

// ── Page — Suspense boundary required for useSearchParams ────────────────────
export default function StripeSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="bg-white rounded-2xl p-10 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto" />
          </div>
        }
      >
        <StripeVerifier />
      </Suspense>
    </div>
  );
}
