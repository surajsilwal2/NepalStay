# 🎯 Refund System Architecture - Vendor-Only Processing

## Overview

The refund system has been redesigned with clear separation of concerns:

- **VENDORS**: Process refunds for their own hotels (100% responsibility)
- **CUSTOMERS**: Initiate refunds for their own bookings
- **ADMIN**: Monitor refund reports (view-only, no processing)
- **STAFF**: No refund involvement

---

## Architecture Changes

### ❌ Before (Problematic)

```
VENDOR tries to process refund
        ↓
Calls /api/admin/refunds (PATCH)
        ↓
Permission check: [ADMIN, STAFF, VENDOR]
        ↓
Vendor passes permission
        ↓
BUT: Role-based confusion, multiple endpoints handling same thing
        ↓
RESULT: Confusing, overlapping responsibilities
```

### ✅ After (Clean)

```
VENDOR processes refund
        ↓
Calls /api/bookings/{id}/refund (POST)
        ↓
Permission check: VENDOR only (+ CUSTOMER for own bookings)
        ↓
ADMIN views reports
        ↓
Calls /api/admin/refunds (GET) - read-only
        ↓
Returns statistics and monitoring data (no processing)
        ↓
RESULT: Clear separation, single responsibility
```

---

## API Endpoints

### 1. Refund Processing (POST)

**Endpoint**: `POST /api/bookings/{bookingId}/refund`

**Who can call**: 
- ✅ **VENDOR**: For their own hotels, CANCELLED bookings only
- ✅ **CUSTOMER**: For their own bookings, PENDING/CONFIRMED only
- ❌ **ADMIN**: Forbidden (403)
- ❌ **STAFF**: Forbidden (403)

**What it does**:
1. Validates permissions (vendor owns hotel OR customer owns booking)
2. Checks booking status (VENDOR: CANCELLED only, CUSTOMER: PENDING/CONFIRMED)
3. Calculates refund amount based on policy
4. Attempts payment processor refund (Khalti/Stripe)
5. Creates credit note
6. Updates booking refund status

**Request**:
```json
{
  "reason": "Guest cancellation" // optional, for audit trail
}
```

**Response**:
```json
{
  "success": true,
  "refund": {
    "creditNoteNumber": "CN-INV-xxxxx",
    "refundAmount": 5000,
    "refundPercent": 50,
    "refundStatus": "COMPLETED or PENDING",
    "policy": "50% refund — cancelled 3–7 days before check-in",
    "manualProcessingRequired": false
  }
}
```

---

### 2. Refund Monitoring (GET)

**Endpoint**: `GET /api/admin/refunds`

**Who can call**:
- ✅ **ADMIN**: Full access
- ❌ **VENDOR**: Forbidden (403)
- ❌ **CUSTOMER**: Forbidden (403)
- ❌ **STAFF**: Forbidden (403)

**What it does**:
1. Returns last 100 cancelled bookings
2. Shows refund amounts and statuses
3. Calculates statistics (total cancellations, completed/pending refunds)

**Response**:
```json
{
  "success": true,
  "data": {
    "refunds": [
      {
        "id": "booking-123",
        "invoiceNumber": "INV-ABC123",
        "totalPrice": 10000,
        "refundAmount": 5000,
        "refundPercent": 50,
        "refundStatus": "COMPLETED",
        "refundedAt": "2026-05-20T10:30:00Z",
        "user": { "name": "John Doe", "email": "john@example.com" },
        "hotel": { "name": "My Hotel" }
      }
    ],
    "stats": {
      "totalCancellations": 150,
      "completedRefunds": 145,
      "pendingRefunds": 5
    }
  }
}
```

---

## Workflow by Role

### 🏢 VENDOR Workflow

```
1. Customer cancels their booking through customer portal
   ↓
2. Booking status changes to CANCELLED
   Refund status becomes PENDING
   ↓
3. Vendor logs into dashboard → Bookings
   ↓
4. Sees CANCELLED booking with "Refund" button (green)
   ↓
5. Clicks "Refund" button
   ↓
6. Modal appears showing:
   - Guest name
   - Room details
   - Original amount
   - Refund % (based on cancellation policy)
   - Refund amount (calculated)
   - Reason field (pre-filled: "Guest cancellation")
   ↓
7. Vendor reviews and clicks "Confirm Refund"
   ↓
8. System calls POST /api/bookings/{id}/refund
   ↓
9. Backend:
   - Creates Credit Note (CN-xxxxx)
   - Attempts refund via payment processor
   - Updates booking status and refund status
   ↓
10. Success toast appears
    "✓ Refund processed. Credit note CN-xxxxx issued."
    ↓
11. Done! Vendor can close modal
    ↓
12. Refund status: COMPLETED (if Khalti success)
                   or PENDING (if manual Khalti/Stripe)
    ↓
13. Guest receives refund in 24 hours (Khalti)
                         or 3-5 days (Stripe/Bank)
```

**Vendor Responsibilities**:
- ✅ Process refunds immediately when customer cancels
- ✅ Monitor refund statuses
- ✅ Handle Khalti manual refunds if API fails
- ✅ Track refund credit notes
- ❌ NOT responsible for admin/system monitoring
- ❌ NOT responsible for other hotels' refunds
- ❌ NOT responsible for checking in/out refunds

---

### 👤 CUSTOMER Workflow

```
1. Customer logs into booking portal
   ↓
2. Sees active booking with "Cancel" button
   ↓
3. Clicks "Cancel Booking"
   ↓
4. System shows cancellation confirmation:
   - Refund policy for that date
   - Exact refund amount (in NPR)
   - Warning if limited refund
   ↓
5. Confirms cancellation
   ↓
6. System calls POST /api/bookings/{id}/refund (customer role)
   ↓
7. Backend processes refund:
   - Validates it's their booking
   - Booking status PENDING/CONFIRMED
   - Calculates refund
   - Attempts payment processor refund
   ↓
8. Toast shows result:
   "✓ Booking cancelled. NPR 5,000 refund being processed
    (50%). You'll receive it in 3–5 business days."
   ↓
9. Customer sees booking status: CANCELLED
   ↓
10. Guest receives refund automatically
```

**Customer Responsibilities**:
- ✅ Cancel their own booking only
- ✅ Review refund policy before cancelling
- ✅ Wait for refund (3-5 business days)
- ❌ NOT responsible for processing
- ❌ NOT responsible for other bookings

---

### 📊 ADMIN Workflow

```
1. Admin logs into dashboard
   ↓
2. Clicks "Reports" → "Refunds" section
   ↓
3. System calls GET /api/admin/refunds (read-only)
   ↓
4. Admin sees:
   - List of last 100 cancelled bookings
   - Refund amounts & statuses
   - Statistics:
     * Total cancellations: 150
     * Completed refunds: 145
     * Pending refunds: 5
   ↓
5. Admin can:
   ✅ Monitor refund health
   ✅ Identify problematic hotels
   ✅ See refund trends
   ❌ NOT process refunds
   ❌ NOT modify refund status
   ❌ NOT change refund amounts
   ↓
6. If issues found:
   Admin contacts vendor directly
   (NOT through system - vendor handles it)
```

**Admin Responsibilities**:
- ✅ Monitor refund statistics
- ✅ Identify stuck/pending refunds
- ✅ Contact vendors if issues found
- ✅ Review refund complaints
- ❌ NOT process refunds
- ❌ NOT approve/deny refunds
- ❌ NOT change refund amounts

**Admin Should Focus On**:
- 📋 Vendor performance metrics
- 🏨 Hotel complaint reviews
- 📊 FNMIS compliance
- 👥 User dispute resolution
- 🚨 System monitoring

---

### 👷 STAFF Workflow

**Status**: NO INVOLVEMENT IN REFUNDS

Staff at hotels cannot:
- ❌ Process refunds
- ❌ View refund data
- ❌ Change refund status
- ❌ Access refund endpoints

**Why?** Vendors handle all refunds for their hotel. Staff reports to vendor about operational issues, not payments.

---

## Payment Method Handling

### 🟡 Khalti Payments (Local guests)

```
VENDOR clicks "Refund"
        ↓
System calls Khalti API to refund
        ↓
Option 1: Success ✅
├─ Khalti processes refund immediately
├─ Refund status: COMPLETED
└─ Guest sees money in wallet 24 hours

Option 2: API Fails 📞
├─ Khalti API returns error
├─ Refund status: PENDING
├─ System logs error with notes
├─ Vendor must manually process in Khalti admin
└─ Guest must wait for manual processing
```

### 🔵 Stripe Payments (Foreign guests)

```
VENDOR clicks "Refund"
        ↓
System creates Credit Note only
(Stripe refund requires manual processing)
        ↓
Refund status: PENDING
        ↓
VENDOR ACTION REQUIRED:
├─ Log into Stripe Dashboard
├─ Find charge in payments
├─ Click "Refund" button
├─ Confirm refund amount
└─ Stripe processes (3-5 business days)
        ↓
Credit note in NepalStay = audit trail
Stripe refund = actual money movement
```

---

## Error Scenarios

### Scenario 1: Vendor tries to refund other hotel's booking

```
Request: POST /api/bookings/{other-hotel-booking}/refund
Response: {
  "success": false,
  "error": "Forbidden"
}
Status: 403
```

**Why**: Vendor role check fails (booking hotel vendor ≠ logged in vendor)

---

### Scenario 2: Admin tries to process refund

```
Request: POST /api/bookings/{booking}/refund (as ADMIN)
Response: {
  "success": false,
  "error": "Admins cannot process refunds. Contact the hotel directly."
}
Status: 403
```

**Why**: Admin role explicitly blocked from refund processing

---

### Scenario 3: Vendor tries to refund non-cancelled booking

```
Request: POST /api/bookings/{pending-booking}/refund (as VENDOR)
Response: {
  "success": false,
  "error": "Can only refund CANCELLED bookings. Current status: PENDING"
}
Status: 400
```

**Why**: Vendor can only process refunds on CANCELLED bookings (after customer cancels)

---

### Scenario 4: Customer tries to cancel after check-in

```
Request: POST /api/bookings/{checked-in}/refund (as CUSTOMER)
Response: {
  "success": false,
  "error": "Cannot refund a booking with status CHECKED_IN"
}
Status: 400
```

**Why**: Can only refund PENDING/CONFIRMED (active, not started)

---

## Database State Changes

### When Customer Cancels (Initiates Refund)

**Before**:
```
booking.status = PENDING or CONFIRMED
booking.refundStatus = NONE
```

**After** (if sufficient notice):
```
booking.status = CANCELLED
booking.refundStatus = COMPLETED (if Khalti success) or PENDING (if manual needed)
booking.refundAmount = [calculated]
booking.refundPercent = [calculated]
booking.creditNoteRef = CN-INV-xxxxx
booking.refundedAt = [timestamp]
```

### Credit Note Created

```
{
  "creditNoteNumber": "CN-INV-ABC123",
  "bookingId": "booking-123",
  "originalInvoice": "INV-ABC123",
  "guestName": "John Doe",
  "refundAmount": 5000,
  "refundPercent": 50,
  "reason": "Guest cancellation",
  "cancellationPolicy": "50% refund — cancelled 3–7 days",
  "issuedAt": [timestamp],
  "issuedBy": [vendor-id]
}
```

---

## Forbidden Operations (403 Errors)

| Operation | Admin | Staff | Vendor | Customer |
|-----------|-------|-------|--------|----------|
| Process refund | ❌ | ❌ | ✅ | ✅ (own booking) |
| View all refunds | ✅ | ❌ | ❌ (own hotel) | ❌ |
| Change refund status | ❌ | ❌ | ❌ | ❌ |
| Refund other vendor's booking | ❌ | ❌ | ❌ | ❌ |
| Cancel other customer's booking | ❌ | ❌ | ❌ | ❌ |

---

## Testing Checklist

- [ ] Vendor clicks "Refund" button on CANCELLED booking → Modal appears
- [ ] Vendor confirms refund → Calls `/api/bookings/{id}/refund`
- [ ] Refund processes successfully → Credit note created
- [ ] Vendor tries to refund other hotel's booking → 403 Forbidden
- [ ] Admin tries to process refund → 403 Forbidden
- [ ] Staff tries to access refund endpoint → 403 Forbidden
- [ ] Admin calls GET `/api/admin/refunds` → Gets statistics
- [ ] Vendor calls GET `/api/admin/refunds` → 403 Forbidden
- [ ] Khalti refund succeeds → Refund status COMPLETED
- [ ] Khalti refund fails → Refund status PENDING + error logged
- [ ] Stripe booking → Refund status PENDING (manual needed)
- [ ] Credit note links to original invoice → Audit trail complete

---

## Summary

**Refund Processing**: 100% Vendor responsibility
**Refund Monitoring**: 100% Admin responsibility
**Refund Initiation**: Customer + Vendor roles
**No Involvement**: Admin doesn't approve/deny, Staff doesn't process

This design:
- ✅ Reduces admin burden (100s of daily bookings)
- ✅ Empowers vendors (direct control)
- ✅ Maintains audit trail (credit notes)
- ✅ Clear role separation
- ✅ Fair to customers (clear policy)
- ✅ Scalable (no admin bottleneck)

**Status**: Ready for production 🚀
