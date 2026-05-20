# NepalStay Cancellation Policy & Refund Flow

## 📋 Cancellation Policy

The cancellation policy is **based on days remaining until check-in**:

| Days to Check-in | Refund % | Description |
|------------------|----------|-------------|
| **> 7 days** | **100%** | Full refund if cancelled more than 7 days before check-in |
| **3-7 days** | **50%** | Half refund if cancelled 3-7 days before check-in |
| **< 3 days** | **25%** | Limited refund (25%) if cancelled less than 3 days before check-in |

### Example Scenarios

**Scenario 1: Cancellation 10 days before check-in**
- Original booking: NPR 10,000
- Days to check-in: 10
- Policy applies: 100% refund
- Refund amount: **NPR 10,000** ✅

**Scenario 2: Cancellation 5 days before check-in**
- Original booking: NPR 10,000
- Days to check-in: 5
- Policy applies: 50% refund
- Refund amount: **NPR 5,000** ✅

**Scenario 3: Cancellation 2 days before check-in**
- Original booking: NPR 10,000
- Days to check-in: 2
- Policy applies: 25% refund
- Refund amount: **NPR 2,500** ✅

---

## 🔄 Booking Cancellation Flow

### For Customers (Guest Cancellation)

```
1. Customer clicks "Cancel Booking" in their booking details
   ↓
2. System shows cancellation confirmation dialog
   - Shows applicable refund % based on cancellation policy
   - Shows refund amount in NPR
   ↓
3. Confirm cancellation
   ↓
4. System processes refund:
   - If paid via Khalti: Attempts automatic refund to Khalti wallet
   - If paid via Stripe: Manual refund (vendor will process)
   - If unpaid: Simply cancels with no refund
   ↓
5. Toast shows friendly message with refund details
   - Example: "✓ Booking cancelled. A partial refund is being processed. 
              You'll receive NPR 5,000 within 3–5 business days."
   ↓
6. Booking status changes to CANCELLED
7. Refund status: COMPLETED (if Khalti) or PENDING (if manual)
```

### For Vendors (Processing Guest Cancellations)

```
1. Vendor sees booking marked as CANCELLED in their dashboard
   ↓
2. If booking was PAID:
   - "Cancel & Refund" button appears
   - Shows current refund policy for that booking
   ↓
3. Vendor clicks "Cancel & Refund"
   ↓
4. Modal appears showing:
   - Guest name & room
   - Original payment amount
   - Applicable refund % and amount
   - Days to check-in (for reference)
   ↓
5. Vendor enters reason (pre-filled as "Guest cancellation")
   - Can change if needed for audit trail
   ↓
6. Vendor clicks "Confirm Refund"
   ↓
7. System processes:
   - Creates a Credit Note (CN-xxxxx) for audit
   - Updates booking refund status:
     * COMPLETED (if Khalti refund succeeded)
     * PENDING (if Khalti refund needs manual completion)
   - Releases room back to AVAILABLE status
   ↓
8. Toast confirms: "Refund processed. Credit note CN-xxxxx issued."
   ↓
9. Booking shows:
   - Status: CANCELLED
   - Refund Status: COMPLETED or PENDING
   - Credit Note Reference: CN-xxxxx
```

---

## 💳 Payment Method & Refund Processing

### Khalti Payment (Local guests)
- **Automatic refund**: If customer cancels, refund is attempted automatically to Khalti wallet
- **Refund time**: Instant to 24 hours (Khalti side)
- **Vendor action**: Click "Cancel & Refund" to trigger refund
- **Final status**: COMPLETED (or PENDING if Khalti API fails)

### Stripe Payment (Foreign guests)
- **Manual refund**: Vendor must manually process refund through Stripe dashboard
- **Refund time**: 3-5 business days (after vendor initiates)
- **Vendor action**: 
  1. Click "Cancel & Refund" to create Credit Note
  2. Go to Stripe dashboard to issue refund
  3. Manually mark as completed in NepalStay admin
- **Final status**: PENDING (vendor needs manual action in Stripe)

### Unpaid Bookings
- **No refund**: Booking simply cancels
- **Vendor action**: System handles automatically
- **Final status**: CANCELLED with NO_REFUND

---

## 🎫 Credit Notes

When a refund is processed, a **Credit Note** is automatically generated:

```
Credit Note Format: CN-INV-xxxxxxxx-xxxxxx
├── Links to original invoice
├── Shows guest name & email
├── Shows room & hotel
├── Lists original amount & refund amount
├── Shows applicable cancellation policy
├── Dated & signed by who issued it
└── Audit trail for accounting
```

**Use case**: Guest can use credit note to rebook or request manual refund from hotel.

---

## 🧮 Refund Status Timeline

| Refund Status | Meaning | Next Step |
|---------------|---------|-----------|
| **NONE** | No cancellation requested | Guest can cancel anytime |
| **PENDING** | Refund initiated, waiting for completion | Vendor/Admin may need manual action |
| **COMPLETED** | Refund successfully processed | Guest will receive money (3-5 days) |
| **NOT_ELIGIBLE** | Booking wasn't paid | No refund needed |

---

## ❓ FAQs

### Q: Why is my refund only 25%?
**A:** You cancelled less than 3 days before check-in. According to the policy:
- **More than 7 days** = 100% refund
- **3 to 7 days** = 50% refund  
- **Less than 3 days** = 25% refund

This is fair for the hotel as they have limited time to rebook.

### Q: When will I get my refund?
**A:** 
- **Khalti**: 24 hours (credited to your Khalti wallet)
- **Stripe**: 3-5 business days (credited to your card)
- **Bank**: May take 2-3 additional days depending on your bank

### Q: Can I cancel my booking anytime?
**A:** Yes, but the refund amount depends on when you cancel. You'll always get at least 25% back.

### Q: What's a Credit Note?
**A:** An official document showing:
- How much was originally paid
- How much refund is being given
- Why the refund is that amount (policy)

It's proof of the refund for both guest and hotel records.

### Q: What if the refund fails?
**A:** 
- Vendor is notified (refund status stays PENDING)
- Vendor can manually investigate in payment dashboard
- Admin may need to manually complete it

---

## 🔧 Admin Workflow for Failed Refunds

If a refund gets stuck in PENDING status:

```
1. Check the Credit Note for failure reason
2. Go to Khalti/Stripe admin dashboard
3. Manually trigger refund if needed
4. Return to NepalStay booking
5. Click "Mark Refund Done" to update status to COMPLETED
6. System sends completion notification to guest
```

---

## 📊 Summary Table: What You See Where

| Where | What You See | Action |
|-------|--------------|--------|
| **Customer Portal** | Booking status & refund amount | Cancel booking (triggers policy) |
| **Vendor Dashboard** | "Cancel & Refund" button | Process refund for cancelled bookings |
| **Booking Details** | Credit Note reference | Proof of refund |
| **Admin Panel** | Refund logs & credit notes | Monitor all refunds |

---

**Last Updated**: May 20, 2026  
**Policy Version**: 1.0 (Effective from all cancellations)
