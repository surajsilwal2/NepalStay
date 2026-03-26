/**
 * Trigger SMS notifications after booking events.
 * Called fire-and-forget — does not block API response.
 * Import this in verify routes and call after prisma.booking.update.
 */
export async function triggerBookingSMS(
  bookingId: string,
  event: "CONFIRMED" | "PAYMENT" | "CANCELLED" | "REMINDER",
) {
  try {
    // Fire and forget — don't await, don't block the payment response
    fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/sms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Internal call — use a shared secret to allow unauthenticated
        "x-internal-key": process.env.NEXTAUTH_SECRET || "internal",
      },
      body: JSON.stringify({ bookingId, event }),
    }).catch((err) => console.error("[SMS_TRIGGER]", err));
  } catch {
    // Never throw — SMS failure must never break payment confirmation
  }
}
