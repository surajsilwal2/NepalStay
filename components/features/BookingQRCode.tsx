"use client";
import { useEffect, useRef } from "react";
import { QrCode, Download } from "lucide-react";

interface Props {
  bookingId: string;
  invoiceNumber: string;
  guestName: string;
  hotelName: string;
  checkIn: string;
  roomName: string;
}

export default function BookingQRCode({
  bookingId,
  invoiceNumber,
  guestName,
  hotelName,
  checkIn,
  roomName,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // QR data — contains all info staff needs to verify at reception
  const qrData = JSON.stringify({
    b: bookingId,
    i: invoiceNumber,
    g: guestName,
    h: hotelName,
    ci: checkIn,
    r: roomName,
    v: "NepalStay-v1",
  });

  useEffect(() => {
    // Dynamically import qrcode to avoid SSR issues
    import("qrcode").then((QRCode) => {
      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, qrData, {
          width: 200,
          margin: 2,
          color: {
            dark: "#1e293b",
            light: "#ffffff",
          },
          errorCorrectionLevel: "H",
        });
      }
    });
  }, [qrData]);

  const downloadQR = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `NepalStay-${invoiceNumber}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center">
      <div className="flex items-center justify-center gap-2 mb-4">
        <QrCode className="w-5 h-5 text-amber-500" />
        <h3 className="font-bold text-slate-800">Check-in QR Code</h3>
      </div>

      {/* QR Canvas */}
      <div className="flex justify-center mb-3">
        <div className="p-3 bg-white border-2 border-amber-200 rounded-xl inline-block shadow-sm">
          <canvas ref={canvasRef} className="rounded" />
        </div>
      </div>

      {/* Info below QR */}
      <div className="text-xs text-slate-500 space-y-0.5 mb-4">
        <p className="font-semibold text-slate-700">{guestName}</p>
        <p>
          {hotelName} · {roomName}
        </p>
        <p className="font-mono text-amber-600">{invoiceNumber}</p>
      </div>

      <p className="text-xs text-slate-400 mb-3">
        Show this QR code at hotel reception for instant check-in
      </p>

      <button
        onClick={downloadQR}
        className="flex items-center gap-2 mx-auto px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-xl hover:bg-amber-100 transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        Download QR Code
      </button>
    </div>
  );
}
