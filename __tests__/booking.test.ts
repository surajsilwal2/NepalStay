import { calculateNights, calculateTotalPrice, getCancellationPolicy } from '@/lib/booking'
import { addDays } from 'date-fns'

describe('Booking System - Refund & Price Calculations', () => {
  const mockToday = new Date('2026-05-16')
  const originalDateNow = Date

  beforeEach(() => {
    // Mock Date.now() to return consistent date
    global.Date.now = jest.fn(() => mockToday.getTime())
  })

  afterEach(() => {
    global.Date.now = originalDateNow.now
  })

  describe('Test 1: Calculate nights between check-in and check-out', () => {
    it('should calculate 3 nights for a 3-night stay', () => {
      const checkIn = new Date('2026-05-20')
      const checkOut = new Date('2026-05-23')
      const expectedNights = 3

      const nights = calculateNights(checkIn, checkOut)

      expect(nights).toBe(expectedNights)
    })

    it('should calculate 7 nights for a week-long stay', () => {
      const checkIn = new Date('2026-05-20')
      const checkOut = new Date('2026-05-27')
      const expectedNights = 7

      const nights = calculateNights(checkIn, checkOut)

      expect(nights).toBe(expectedNights)
    })

    it('should return minimum 1 night even if same day', () => {
      const checkIn = new Date('2026-05-20')
      const checkOut = new Date('2026-05-20')
      const expectedNights = 1

      const nights = calculateNights(checkIn, checkOut)

      expect(nights).toBe(expectedNights)
    })
  })

  describe('Test 2: Calculate total booking price', () => {
    it('should calculate total price: 3 nights × NPR 5,000 = NPR 15,000', () => {
      const pricePerNight = 5000
      const checkIn = new Date('2026-05-20')
      const checkOut = new Date('2026-05-23')
      const expectedTotalPrice = 15000 // 3 nights × 5000

      const totalPrice = calculateTotalPrice(pricePerNight, checkIn, checkOut)

      expect(totalPrice).toBe(expectedTotalPrice)
    })

    it('should calculate total price: 5 nights × NPR 8,500 = NPR 42,500', () => {
      const pricePerNight = 8500
      const checkIn = new Date('2026-05-25')
      const checkOut = new Date('2026-05-30')
      const expectedTotalPrice = 42500 // 5 nights × 8500

      const totalPrice = calculateTotalPrice(pricePerNight, checkIn, checkOut)

      expect(totalPrice).toBe(expectedTotalPrice)
    })
  })

  describe('Test 3: Cancellation policy - >7 days before check-in (100% refund)', () => {
    it('should return 100% refund if cancelled 10 days before check-in', () => {
      const checkIn = new Date('2026-05-26') // 10 days from today (2026-05-16)
      const policy = getCancellationPolicy(checkIn)

      expect(policy.percent).toBe(100)
      expect(policy.description).toContain('Full refund')
      expect(policy.daysToCheckIn).toBe(10)
    })

    it('should return 100% refund if cancelled 14 days before check-in', () => {
      const checkIn = new Date('2026-05-30') // 14 days from today
      const policy = getCancellationPolicy(checkIn)

      expect(policy.percent).toBe(100)
      expect(policy.daysToCheckIn).toBe(14)
    })
  })

  describe('Test 4: Cancellation policy - 3-7 days before check-in (50% refund)', () => {
    it('should return 50% refund if cancelled 5 days before check-in', () => {
      const checkIn = new Date('2026-05-21') // 5 days from today (2026-05-16)
      const policy = getCancellationPolicy(checkIn)

      expect(policy.percent).toBe(50)
      expect(policy.description).toContain('50% refund')
      expect(policy.daysToCheckIn).toBe(5)
    })

    it('should return 50% refund if cancelled exactly 7 days before check-in', () => {
      const checkIn = new Date('2026-05-23') // 7 days from today
      const policy = getCancellationPolicy(checkIn)

      expect(policy.percent).toBe(50)
      expect(policy.daysToCheckIn).toBe(7)
    })

    it('should return 50% refund if cancelled exactly 3 days before check-in', () => {
      const checkIn = new Date('2026-05-19') // 3 days from today
      const policy = getCancellationPolicy(checkIn)

      expect(policy.percent).toBe(50)
      expect(policy.daysToCheckIn).toBe(3)
    })
  })

  describe('Test 5: Cancellation policy - <3 days before check-in (0% refund)', () => {
    it('should return 0% refund if cancelled 2 days before check-in', () => {
      const checkIn = new Date('2026-05-18') // 2 days from today
      const policy = getCancellationPolicy(checkIn)

      expect(policy.percent).toBe(0)
      expect(policy.description).toContain('No refund')
      expect(policy.daysToCheckIn).toBe(2)
    })

    it('should return 0% refund if cancelled 1 day before check-in', () => {
      const checkIn = new Date('2026-05-17') // 1 day from today
      const policy = getCancellationPolicy(checkIn)

      expect(policy.percent).toBe(0)
      expect(policy.daysToCheckIn).toBe(1)
    })

    it('should return 0% refund if cancelled on same day as check-in', () => {
      const checkIn = new Date('2026-05-16') // today
      const policy = getCancellationPolicy(checkIn)

      expect(policy.percent).toBe(0)
      expect(policy.daysToCheckIn).toBe(0)
    })
  })

  describe('Test 6: End-to-end refund calculation', () => {
    it('should refund 100% of NPR 15,000 for cancellation >7 days before', () => {
      const bookingAmount = 15000
      const checkIn = new Date('2026-05-26') // 10 days away
      const policy = getCancellationPolicy(checkIn)
      const refundAmount = (bookingAmount * policy.percent) / 100

      expect(refundAmount).toBe(15000) // 100% of 15000
    })

    it('should refund 50% of NPR 15,000 for cancellation 3-7 days before', () => {
      const bookingAmount = 15000
      const checkIn = new Date('2026-05-21') // 5 days away
      const policy = getCancellationPolicy(checkIn)
      const refundAmount = (bookingAmount * policy.percent) / 100

      expect(refundAmount).toBe(7500) // 50% of 15000
    })

    it('should refund 0% for cancellation <3 days before', () => {
      const bookingAmount = 15000
      const checkIn = new Date('2026-05-18') // 2 days away
      const policy = getCancellationPolicy(checkIn)
      const refundAmount = (bookingAmount * policy.percent) / 100

      expect(refundAmount).toBe(0) // 0% of 15000
    })
  })
})
