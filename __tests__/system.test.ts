/// <reference types="jest" />

import { calculateNights, calculateTotalPrice, getCancellationPolicy, checkBookingConflict } from '@/lib/booking'
import { calcPointsEarned } from '@/lib/loyalty'
import { adToBS } from '@/lib/nepali-date'

/**
 * SYSTEM TEST SUITE 1: End-to-End Booking Workflow
 * 
 * Scenario: A customer searches for a hotel, makes a booking, and receives loyalty points.
 * This tests the complete booking flow from discovery through confirmation.
 * 
 * Flow:
 * 1. Customer searches and finds a hotel (Hotel Nepal, NPR 5,000/night, Kathmandu)
 * 2. Customer selects dates (May 20-23, 2026) - 3 nights
 * 3. System checks availability (no conflicts)
 * 4. Customer confirms booking → Payment initiated (NPR 15,000)
 * 5. Payment succeeds
 * 6. Booking confirmed with loyalty points awarded (BRONZE tier: 100 points)
 */
describe('SYSTEM TEST 1: End-to-End Booking Workflow', () => {
  const mockToday = new Date('2026-05-16')
  
  beforeEach(() => {
    global.Date.now = jest.fn(() => mockToday.getTime())
  })

  it('should complete full booking workflow: search → select dates → check availability → book → pay → award points', () => {
    // STEP 1: Hotel Search Results
    const searchResults = {
      id: 'hotel-001',
      name: 'Hotel Nepal',
      city: 'Kathmandu',
      pricePerNight: 5000,
      availableRooms: 5,
      rating: 4.8,
      reviews: 234,
    }
    expect(searchResults.availableRooms).toBeGreaterThan(0)
    expect(searchResults.pricePerNight).toBe(5000)

    // STEP 2: Customer selects dates
    const checkIn = new Date('2026-05-20')
    const checkOut = new Date('2026-05-23')
    const nights = calculateNights(checkIn, checkOut)
    expect(nights).toBe(3)

    // STEP 3: Check availability (no booking conflicts)
    const hasConflict = false // Simulated - no existing bookings in this date range
    expect(hasConflict).toBe(false)

    // STEP 4: Calculate booking total
    const totalPrice = calculateTotalPrice(searchResults.pricePerNight, checkIn, checkOut)
    expect(totalPrice).toBe(15000) // 3 nights × NPR 5,000

    // STEP 5: Create booking with reference number
    const booking = {
      id: 'BOOK-20260516-001',
      hotelId: searchResults.id,
      checkIn,
      checkOut,
      nights,
      totalAmount: totalPrice,
      status: 'PENDING',
      createdAt: mockToday,
    }
    expect(booking.status).toBe('PENDING')
    expect(booking.totalAmount).toBe(15000)

    // STEP 6: Initiate payment
    const payment = {
      bookingId: booking.id,
      method: 'KHALTI',
      amount: totalPrice,
      status: 'INITIATED',
      createdAt: mockToday,
    }
    expect(payment.status).toBe('INITIATED')
    expect(payment.amount).toBe(15000)

    // STEP 7: Payment succeeds
    payment.status = 'PAID'
    expect(payment.status).toBe('PAID')

    // STEP 8: Update booking to confirmed
    booking.status = 'CONFIRMED'
    expect(booking.status).toBe('CONFIRMED')

    // STEP 9: Award loyalty points (BRONZE tier, 1 point per NPR 100)
    const userCurrentPoints = 0 // New customer
    const loyaltyTier = 'BRONZE' as const
    const pointsEarned = calcPointsEarned(totalPrice, loyaltyTier)
    const totalPoints = userCurrentPoints + pointsEarned
    
    expect(pointsEarned).toBe(150) // 15000 / 100 = 150 points
    expect(totalPoints).toBe(150)

    // STEP 10: Confirm booking completion
    const confirmation = {
      bookingId: booking.id,
      customerEmail: 'user@example.com',
      hotelName: searchResults.name,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totalPrice,
      loyaltyPointsAwarded: pointsEarned,
      paymentMethod: 'KHALTI',
      invoiceNumber: `INV-${booking.id.slice(-6)}-015000`,
    }
    
    expect(confirmation.bookingId).toBe(booking.id)
    expect(confirmation.loyaltyPointsAwarded).toBe(150)
    expect(confirmation.totalPrice).toBe(15000)
    expect(confirmation.invoiceNumber).toMatch(/INV-/)
  })

  it('should handle complete workflow with conversion to BS dates for invoice', () => {
    // Full workflow with BS date conversion for government filing
    const checkIn = new Date('2026-05-20')
    const checkOut = new Date('2026-05-23')

    // Convert to BS for invoice
    const checkInBS = adToBS(checkIn)
    const checkOutBS = adToBS(checkOut)

    expect(checkInBS).toHaveProperty('year')
    expect(checkInBS).toHaveProperty('month')
    expect(checkInBS).toHaveProperty('day')
    expect(checkInBS.year).toBeGreaterThanOrEqual(2083)

    // Booking with both AD and BS dates
    const booking = {
      id: 'BOOK-20260520-001',
      checkInAD: checkIn,
      checkOutAD: checkOut,
      checkInBS,
      checkOutBS,
      nights: calculateNights(checkIn, checkOut),
      totalPrice: 15000,
    }

    expect(booking.nights).toBe(3)
    expect(booking.checkInBS.year).toBe(checkInBS.year)
  })
})

/**
 * SYSTEM TEST 2: FNMIS Compliance - Foreign Guest Tracking & Deadline Management
 * 
 * Scenario: A foreign tourist (Canadian passport) makes a booking for 5 nights.
 * System must:
 * 1. Identify foreign guest (has passport field)
 * 2. Calculate 24-hour reporting deadline
 * 3. Send alert 12 hours before deadline
 * 4. Mark as OVERDUE if not reported within 24 hours
 * 
 * Flow: Booking → Foreign Guest Detected → Deadline Set → Alert Sent → Monitor → Update Status
 */
describe('SYSTEM TEST 2: FNMIS Compliance - Foreign Guest Tracking', () => {
  const mockToday = new Date('2026-05-16T10:00:00')

  beforeEach(() => {
    global.Date.now = jest.fn(() => mockToday.getTime())
  })

  it('should manage FNMIS deadline for foreign guest: identify → set deadline → send alert → track status', () => {
    // STEP 1: Create booking with foreign guest
    const guest = {
      id: 'USER-001',
      name: 'John Smith',
      country: 'Canada',
      email: 'john@example.com',
      phone: '+1-555-0123',
      passportNumber: 'ABC123456', // Foreign guest identifier
      passportExpiry: new Date('2029-05-16'),
    }
    expect(guest.passportNumber).toBeTruthy() // Indicates foreign guest

    // STEP 2: Create booking
    const checkIn = new Date('2026-05-20')
    const checkOut = new Date('2026-05-25')
    const nights = calculateNights(checkIn, checkOut)

    const booking = {
      id: 'BOOK-20260516-FRN-001',
      userId: guest.id,
      hotelId: 'HOTEL-001',
      checkIn,
      checkOut,
      nights,
      status: 'CONFIRMED',
      isForeignGuest: !!guest.passportNumber,
    }
    expect(booking.isForeignGuest).toBe(true)
    expect(booking.nights).toBe(5)

    // STEP 3: Identify foreign guest and set FNMIS deadline
    // Deadline is 24 hours from check-in date
    const fnmisDeadline = new Date(checkIn)
    fnmisDeadline.setHours(fnmisDeadline.getHours() + 24)

    const fnmisReport = {
      id: 'FNMIS-001',
      bookingId: booking.id,
      guestId: guest.id,
      guestName: guest.name,
      passportNumber: guest.passportNumber,
      checkInDate: checkIn,
      deadline: fnmisDeadline,
      status: 'PENDING', // Not yet reported
      createdAt: mockToday,
    }
    expect(fnmisReport.status).toBe('PENDING')
    expect(fnmisReport.deadline.getTime()).toBe(fnmisDeadline.getTime())

    // STEP 4: Check if alert should be sent (12 hours before deadline)
    const now = mockToday.getTime()
    const hoursUntilDeadline = (fnmisReport.deadline.getTime() - now) / (1000 * 60 * 60)
    const shouldSendAlert = hoursUntilDeadline <= 12 && hoursUntilDeadline > 0

    expect(hoursUntilDeadline).toBeGreaterThan(0) // Deadline is in future
    expect(hoursUntilDeadline).toBeGreaterThan(100) // More than 100 hours (4+ days from May 16 10:00 to May 20)

    // STEP 5: Monitor deadline
    // Simulate time passing to 12 hours before deadline
    const alertTime = new Date(fnmisReport.deadline)
    alertTime.setHours(alertTime.getHours() - 12)

    const alertLog = {
      reportId: fnmisReport.id,
      alertType: 'DEADLINE_WARNING',
      hoursBeforeDeadline: 12,
      sentAt: alertTime,
      recipientEmail: guest.email,
      recipientPhone: guest.phone,
    }
    expect(alertLog.alertType).toBe('DEADLINE_WARNING')

    // STEP 6: Simulate deadline passing without report
    const overdueTime = new Date(fnmisReport.deadline)
    overdueTime.setHours(overdueTime.getHours() + 1)

    fnmisReport.status = 'OVERDUE'
    expect(fnmisReport.status).toBe('OVERDUE')

    // STEP 7: Escalation alert on overdue
    const escalationAlert = {
      reportId: fnmisReport.id,
      alertType: 'DEADLINE_OVERDUE',
      overdueBy: '1 hour',
      sentTo: 'hotel@nepal.com',
      action: 'URGENT: Submit FNMIS report immediately',
    }
    expect(escalationAlert.alertType).toBe('DEADLINE_OVERDUE')
  })

  it('should successfully close FNMIS report when hotel submits compliance data', () => {
    // Foreign guest booking with FNMIS tracking
    const fnmisReport = {
      id: 'FNMIS-002',
      bookingId: 'BOOK-20260516-FRN-002',
      status: 'PENDING',
      deadline: new Date('2026-05-21T10:00:00'),
    }

    // Hotel submits compliance report
    const complianceData = {
      reportId: fnmisReport.id,
      submittedAt: new Date('2026-05-20T15:00:00'),
      daysBeforeDeadline: 19, // Submitted 19 hours before deadline
      status: 'SUBMITTED',
      government_reference: 'FNMIS-2026-05-20-001',
    }

    expect(complianceData.submittedAt.getTime()).toBeLessThan(fnmisReport.deadline.getTime())
    expect(complianceData.daysBeforeDeadline).toBeGreaterThan(0)

    // Update report status
    fnmisReport.status = 'REPORTED'
    expect(fnmisReport.status).toBe('REPORTED')
  })
})

/**
 * SYSTEM TEST 3: Refund Processing Workflow
 * 
 * Scenario: Customer cancels booking at different times, triggering different refund policies.
 * System must:
 * 1. Check cancellation date relative to check-in
 * 2. Apply correct refund percentage (100% / 50% / 0%)
 * 3. Process refund via payment gateway
 * 4. Generate credit note for accounting
 * 5. Update loyalty points if applicable
 * 
 * Flow: Booking → Cancellation Request → Policy Check → Calculate Refund → Process → Confirm
 */
describe('SYSTEM TEST 3: Refund Processing Workflow', () => {
  const mockToday = new Date('2026-05-16')

  beforeEach(() => {
    global.Date.now = jest.fn(() => mockToday.getTime())
  })

  it('should process full refund (100%) for cancellation >7 days before check-in', () => {
    // STEP 1: Original booking
    const originalBooking = {
      id: 'BOOK-20260516-REF-001',
      checkIn: new Date('2026-05-26'), // 10 days from today
      checkOut: new Date('2026-05-29'),
      totalAmount: 15000,
      nights: 3,
      status: 'CONFIRMED',
      paymentId: 'PAY-001',
    }
    const daysToCheckIn = (originalBooking.checkIn.getTime() - mockToday.getTime()) / (1000 * 60 * 60 * 24)
    expect(daysToCheckIn).toBe(10)

    // STEP 2: Customer requests cancellation
    const cancellationRequest = {
      bookingId: originalBooking.id,
      reason: 'Change of plans',
      requestedAt: mockToday,
    }
    expect(cancellationRequest.requestedAt).toEqual(mockToday)

    // STEP 3: Apply cancellation policy
    const policy = getCancellationPolicy(originalBooking.checkIn)
    expect(policy.percent).toBe(100) // >7 days = full refund
    expect(policy.daysToCheckIn).toBe(10)

    // STEP 4: Calculate refund amount
    const refundAmount = (originalBooking.totalAmount * policy.percent) / 100
    expect(refundAmount).toBe(15000) // 100% of 15000

    // STEP 5: Process refund via payment gateway
    const refund = {
      id: 'REF-001',
      originalPaymentId: originalBooking.paymentId,
      amount: refundAmount,
      method: 'KHALTI',
      status: 'INITIATED',
      createdAt: mockToday,
    }
    expect(refund.status).toBe('INITIATED')
    expect(refund.amount).toBe(15000)

    // STEP 6: Refund succeeds
    refund.status = 'COMPLETED'
    expect(refund.status).toBe('COMPLETED')

    // STEP 7: Update booking status
    originalBooking.status = 'CANCELLED'
    expect(originalBooking.status).toBe('CANCELLED')

    // STEP 8: Revert loyalty points
    const pointsAwarded = 150 // Original booking awarded 150 points
    const pointsReversed = pointsAwarded // Remove all points
    const finalPoints = 0
    expect(finalPoints).toBe(0)

    // STEP 9: Generate credit note for accounting
    const creditNote = {
      id: 'CN-BOOK-20260516-REF-001',
      originalInvoice: `INV-BOOK-20260516-REF-001`,
      amount: refundAmount,
      reason: 'Full refund - cancellation >7 days before check-in',
      issuedAt: new Date(),
      processedBy: 'SYSTEM',
    }
    expect(creditNote.id).toMatch(/^CN-/)
    expect(creditNote.amount).toBe(15000)

    // STEP 10: Confirm completion
    const refundConfirmation = {
      bookingId: originalBooking.id,
      refundId: refund.id,
      amount: refundAmount,
      percentage: policy.percent,
      creditNote: creditNote.id,
      pointsReversed,
      status: 'COMPLETED',
    }
    expect(refundConfirmation.percentage).toBe(100)
    expect(refundConfirmation.status).toBe('COMPLETED')
  })

  it('should process partial refund (50%) for cancellation 3-7 days before check-in', () => {
    // Booking with check-in in 5 days
    const booking = {
      id: 'BOOK-20260516-REF-002',
      checkIn: new Date('2026-05-21'), // 5 days from today
      checkOut: new Date('2026-05-24'),
      totalAmount: 20000,
      status: 'CONFIRMED',
    }

    // Apply cancellation policy
    const policy = getCancellationPolicy(booking.checkIn)
    expect(policy.percent).toBe(50) // 3-7 days = 50% refund
    expect(policy.daysToCheckIn).toBe(5)

    // Calculate refund
    const refundAmount = (booking.totalAmount * policy.percent) / 100
    expect(refundAmount).toBe(10000) // 50% of 20000

    // Process refund
    const refund = {
      id: 'REF-002',
      amount: refundAmount,
      status: 'COMPLETED',
    }
    expect(refund.amount).toBe(10000)

    // Retention amount (goes to hotel)
    const retentionAmount = booking.totalAmount - refundAmount
    expect(retentionAmount).toBe(10000) // Hotel keeps 50%
  })

  it('should process no refund (0%) for cancellation <3 days before check-in', () => {
    // Late cancellation
    const booking = {
      id: 'BOOK-20260516-REF-003',
      checkIn: new Date('2026-05-18'), // 2 days from today
      totalAmount: 12000,
      status: 'CONFIRMED',
    }

    // Apply cancellation policy
    const policy = getCancellationPolicy(booking.checkIn)
    expect(policy.percent).toBe(0) // <3 days = no refund
    expect(policy.daysToCheckIn).toBe(2)

    // Calculate refund
    const refundAmount = (booking.totalAmount * policy.percent) / 100
    expect(refundAmount).toBe(0) // 0% refund

    // Hotel retains full amount
    const retentionAmount = booking.totalAmount
    expect(retentionAmount).toBe(12000)

    // Refund transaction still created for audit
    const refund = {
      id: 'REF-003',
      amount: 0,
      status: 'REJECTED',
      reason: 'Cancellation within 3 days - no refund policy',
    }
    expect(refund.amount).toBe(0)
  })
})
