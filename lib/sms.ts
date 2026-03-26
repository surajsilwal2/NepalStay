/**
 * SPARROW SMS Nepal Integration
 * Website: sparrowsms.com
 * Nepal's leading bulk SMS service.
 * Free trial: 25 SMS for testing.
 * Production: ~NPR 1 per SMS.
 *
 * Add to .env:
 * SPARROW_SMS_TOKEN="your_sparrow_api_token"
 * SPARROW_SMS_FROM="NepalStay"
 */

const SPARROW_BASE = "http://api.sparrowsms.com/v2/sms/";

interface SMSResult {
  success: boolean;
  message: string;
  credits?: number;
}

/**
 * Send a single SMS via SPARROW SMS Nepal.
 * @param to    Nepali phone number e.g. "9841000001" or "+977-9841000001"
 * @param text  SMS body (max 160 chars for single SMS)
 */
export async function sendSMS(to: string, text: string): Promise<SMSResult> {
  if (!process.env.SPARROW_SMS_TOKEN) {
    console.warn("[SMS] SPARROW_SMS_TOKEN not set — SMS not sent");
    return { success: false, message: "SMS service not configured" };
  }

  // Normalize phone number — SPARROW expects 10-digit Nepali number
  const normalized = to
    .replace(/\D/g, "") // remove non-digits
    .replace(/^977/, "") // remove country code if present
    .replace(/^\+977/, "")
    .slice(-10); // last 10 digits

  if (normalized.length !== 10) {
    return { success: false, message: `Invalid phone number: ${to}` };
  }

  try {
    const params = new URLSearchParams({
      token: process.env.SPARROW_SMS_TOKEN,
      from: process.env.SPARROW_SMS_FROM || "NepalStay",
      to: normalized,
      text: text.slice(0, 160), // truncate to single SMS
    });

    const res = await fetch(`${SPARROW_BASE}?${params}`, { method: "GET" });
    const data = await res.json();

    if (data.response_code === 200) {
      return {
        success: true,
        message: "SMS sent",
        credits: data.credits_consumed,
      };
    }

    console.error("[SMS] SPARROW error:", data);
    return { success: false, message: data.message || "SMS failed" };
  } catch (error) {
    console.error("[SMS]", error);
    return { success: false, message: "SMS service unreachable" };
  }
}

// ── Pre-built SMS templates ───────────────────────────────────────────────────

export function bookingConfirmedSMS(params: {
  guestName: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  invoiceNumber: string;
  totalPrice: number;
}): string {
  return `NepalStay: Booking confirmed! ${params.hotelName}, ${params.checkIn} to ${params.checkOut}. Invoice: ${params.invoiceNumber}. Total: NPR ${params.totalPrice.toLocaleString()}. Thank you!`;
}

export function bookingCancelledSMS(params: {
  guestName: string;
  hotelName: string;
  checkIn: string;
  refundAmount?: number;
  creditNote?: string;
}): string {
  const refundMsg =
    params.refundAmount && params.refundAmount > 0
      ? ` Refund of NPR ${params.refundAmount.toLocaleString()} will be processed in 3-5 business days. Ref: ${params.creditNote}.`
      : " No refund applicable.";
  return `NepalStay: Your booking at ${params.hotelName} on ${params.checkIn} has been cancelled.${refundMsg}`;
}

export function checkInReminderSMS(params: {
  guestName: string;
  hotelName: string;
  checkIn: string;
  checkInTime: string;
  phone: string;
}): string {
  return `NepalStay: Reminder! Check-in at ${params.hotelName} is tomorrow (${params.checkIn}) at ${params.checkInTime}. Hotel: ${params.phone}. Show your QR code at reception.`;
}

export function paymentReceivedSMS(params: {
  guestName: string;
  invoiceNumber: string;
  amount: number;
  method: string;
}): string {
  return `NepalStay: Payment received! NPR ${params.amount.toLocaleString()} via ${params.method}. Invoice: ${params.invoiceNumber}. Your booking is confirmed!`;
}

export function vendorNewBookingSMS(params: {
  hotelName: string;
  guestName: string;
  checkIn: string;
  nights: number;
  roomName: string;
  totalPrice: number;
}): string {
  return `NepalStay: New booking! ${params.guestName} booked ${params.roomName} at ${params.hotelName} from ${params.checkIn} (${params.nights} nights). NPR ${params.totalPrice.toLocaleString()}.`;
}
