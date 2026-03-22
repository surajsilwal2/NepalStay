"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import Link from "next/link";

function StripeVerifier() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [invoice, setInvoice] = useState("");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const bookingId = searchParams.get("bookingId");

    if (!sessionId || !bookingId) {
      setStatus("error");
      setErrMsg("Missing payment details.");
      return;
    }

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
          setErrMsg(data.error);
        }
      })
      .catch(() => {
        setStatus("error");
        setErrMsg("Network error.");
      });
  }, [searchParams]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 max-w-md w-full text-center">
      {status === "loading" && (
        <>
          <Loader2 className="w-14 h-14 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800">
            Verifying payment…
          </h2>
        </>
      )}
      {status === "success" && (
        <>
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800">
            Payment Successful!
          </h2>
          <p className="text-slate-500 mt-2">Your booking is confirmed.</p>
          {invoice && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-xs text-green-600 font-medium uppercase tracking-wide">
                Invoice
              </p>
              <p className="text-lg font-bold text-green-700 font-mono mt-1">
                {invoice}
              </p>
            </div>
          )}
          <Link
            href="/customer/bookings"
            className="mt-6 inline-block px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700"
          >
            View My Bookings
          </Link>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800">
            Verification Failed
          </h2>
          <p className="text-slate-500 mt-2 text-sm">{errMsg}</p>
          <Link
            href="/customer/bookings"
            className="mt-6 inline-block px-6 py-2.5 bg-slate-700 text-white font-semibold rounded-xl"
          >
            Check My Bookings
          </Link>
        </>
      )}
    </div>
  );
}

export default function StripeSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Suspense
        fallback={<Loader2 className="w-10 h-10 animate-spin text-blue-500" />}
      >
        <StripeVerifier />
      </Suspense>
    </div>
  );
}
