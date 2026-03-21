"use client";
import { useState } from "react";
import { Loader2, CreditCard, CheckCircle, ExternalLink, RefreshCw } from "lucide-react";
import { useToast } from "@/components/providers/ToastContext";

type Step = "idle" | "initiated" | "verifying" | "done" | "error";

interface Props {
  bookingId: string;
  amount: number;
  onSuccess?: () => void;
}

export default function KhaltiButton({ bookingId, amount, onSuccess }: Props) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [step, setStep]   = useState<Step>("idle");
  const [pidx, setPidx]   = useState("");
  const [errMsg, setErrMsg] = useState("");

  const handleInitiate = async () => {
    setStep("verifying");
    setErrMsg("");
    try {
      const res  = await fetch("/api/payment/khalti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!data.success) { setErrMsg(data.error || "Payment initiation failed"); setStep("error"); return; }
      setPidx(data.data.pidx);
      window.open(data.data.payment_url, "_blank", "noopener,noreferrer");
      setStep("initiated");
    } catch {
      setErrMsg("Network error. Please check your connection.");
      setStep("error");
    }
  };

  const handleVerify = async () => {
    if (!pidx) return;
    setStep("verifying");
    try {
      const res  = await fetch("/api/payment/khalti/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pidx, bookingId }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("done");
        toastSuccess(`Payment confirmed! Invoice ${data.data.invoiceNumber}`);
        onSuccess?.();
      } else {
        setErrMsg(data.error || "Verification failed. If you paid, please wait and try again.");
        setStep("initiated");
        toastError(data.error || "Payment verification failed");
      }
    } catch {
      setErrMsg("Network error during verification.");
      setStep("initiated");
    }
  };

  if (step === "done") {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium justify-center">
        <CheckCircle className="w-4 h-4" />Payment Confirmed
      </div>
    );
  }
  if (step === "verifying") {
    return (
      <div className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#5C2D8C] text-white font-semibold rounded-xl text-sm opacity-80">
        <Loader2 className="w-4 h-4 animate-spin" />Processing…
      </div>
    );
  }
  if (step === "initiated") {
    return (
      <div className="space-y-3">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
          <p className="font-semibold mb-1">Complete your payment in the Khalti tab</p>
          <p className="text-xs text-blue-600">Once done, click below to confirm your booking.</p>
        </div>
        <button onClick={handleVerify}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-semibold rounded-xl transition-all text-sm">
          <CheckCircle className="w-4 h-4" />I've Completed Payment
        </button>
        <button onClick={handleInitiate}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs hover:bg-slate-50">
          <ExternalLink className="w-3 h-3" />Re-open Khalti tab
        </button>
        {errMsg && <p className="text-xs text-red-600 text-center">{errMsg}</p>}
      </div>
    );
  }
  if (step === "error") {
    return (
      <div className="space-y-2">
        <p className="text-xs text-red-600 text-center">{errMsg}</p>
        <button onClick={() => { setStep("idle"); setErrMsg(""); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50">
          <RefreshCw className="w-3.5 h-3.5" />Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button onClick={handleInitiate}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#5C2D8C] hover:bg-[#4A2470] active:scale-95 text-white font-semibold rounded-xl transition-all text-sm">
        <CreditCard className="w-4 h-4" />
        Pay NPR {amount.toLocaleString()} via Khalti
        <ExternalLink className="w-3 h-3 opacity-70" />
      </button>
      <p className="text-xs text-slate-400 text-center">Secured by Khalti · Opens in a new tab</p>
    </div>
  );
}
