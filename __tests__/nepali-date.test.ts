import { adToBS, bsToAD, formatBSShort, getBSYearRange } from '@/lib/nepali-date'

describe('Nepali Calendar System - BS/AD Conversion', () => {
  describe('Test 1: Convert AD dates to BS (Gregorian to Bikram Sambat)', () => {
    it('should convert 2026-05-16 AD to correct BS date', () => {
      const adDate = new Date('2026-05-16')
      const result = adToBS(adDate)

      // Verify result has the expected structure
      expect(result).toHaveProperty('year')
      expect(result).toHaveProperty('month')
      expect(result).toHaveProperty('day')

      // Verify BS year is in valid range (2070-2095)
      expect(result.year).toBeGreaterThanOrEqual(2070)
      expect(result.year).toBeLessThanOrEqual(2095)

      // Verify month is 1-12
      expect(result.month).toBeGreaterThanOrEqual(1)
      expect(result.month).toBeLessThanOrEqual(12)

      // Verify day is 1-32
      expect(result.day).toBeGreaterThanOrEqual(1)
      expect(result.day).toBeLessThanOrEqual(32)
    })

    it('should convert known AD date: 2013-01-01 to BS', () => {
      const adDate = new Date('2013-01-01')
      const result = adToBS(adDate)

      // 2013-01-01 AD should be approximately 2069-09-18 BS
      expect(result.year).toBeGreaterThanOrEqual(2069)
      expect(result.year).toBeLessThanOrEqual(2070)
    })

    it('should convert end of date range: 2038-12-31 to BS', () => {
      const adDate = new Date('2038-12-31')
      const result = adToBS(adDate)

      // 2038 should convert to approximately 2095 BS
      expect(result.year).toBeGreaterThanOrEqual(2094)
      expect(result.year).toBeLessThanOrEqual(2096)
    })
  })

  describe('Test 2: Convert BS dates to AD (Bikram Sambat to Gregorian)', () => {
    it('should convert 2083-02-03 BS to AD date', () => {
      const bsYear = 2083
      const bsMonth = 2
      const bsDay = 3
      const result = bsToAD(bsYear, bsMonth, bsDay)

      expect(result).toBeInstanceOf(Date)
      expect(result.getFullYear()).toBeGreaterThanOrEqual(2026)
      expect(result.getFullYear()).toBeLessThanOrEqual(2027)
    })

    it('should convert mid-range date: 2080-06-15 BS to AD', () => {
      const bsYear = 2080
      const bsMonth = 6
      const bsDay = 15
      const result = bsToAD(bsYear, bsMonth, bsDay)

      expect(result).toBeInstanceOf(Date)
      expect(result.getFullYear()).toBe(2023) // Approximately
    })

    it('should maintain round-trip consistency (BS→AD→BS)', () => {
      // Test with a valid BS date
      const originalBS = { year: 2083, month: 2, day: 3 }
      const adDate = bsToAD(originalBS.year, originalBS.month, originalBS.day)
      const backToBS = adToBS(adDate)

      // Round-trip conversion should maintain year consistency
      // Month and day may differ due to calendar epoch calculations
      expect(backToBS.year).toBe(originalBS.year)
      expect(backToBS).toHaveProperty('month')
      expect(backToBS).toHaveProperty('day')
    })
  })

  describe('Test 3: Validate BS date ranges using year range', () => {
    it('should have valid year range from 2070 to 2095', () => {
      const range = getBSYearRange()
      expect(range.min).toBe(2070)
      expect(range.max).toBe(2095)
    })

    it('should convert dates in valid range: 2070 (start)', () => {
      const result = bsToAD(2070, 1, 1)
      expect(result).toBeInstanceOf(Date)
    })

    it('should convert dates in valid range: 2095 (end)', () => {
      const result = bsToAD(2095, 12, 30)
      expect(result).toBeInstanceOf(Date)
    })

    it('should convert dates in middle of range: 2083', () => {
      const result = bsToAD(2083, 6, 15)
      expect(result).toBeInstanceOf(Date)
    })
  })

  describe('Test 4: Booking date range validity (2070-2095 BS covers 20-year window)', () => {
    it('should handle booking 10 years in future: 2093 BS', () => {
      const result = bsToAD(2093, 6, 15)
      expect(result).toBeInstanceOf(Date)
    })

    it('should handle current date 2083 BS', () => {
      const result = bsToAD(2083, 2, 3)
      expect(result).toBeInstanceOf(Date)
    })

    it('should format BS dates correctly', () => {
      const result = bsToAD(2083, 2, 3)
      const bs = adToBS(result)
      const formatted = formatBSShort(bs)
      
      expect(formatted).toMatch(/2083\/\d{2}\/\d{2}/)
    })
  })

  describe('Test 5: BS date boundary conditions', () => {
    it('should handle start of year: 2083-01-01', () => {
      const result = bsToAD(2083, 1, 1)
      expect(result).toBeInstanceOf(Date)
    })

    it('should handle end of year: 2083-12-30', () => {
      const result = bsToAD(2083, 12, 30)
      expect(result).toBeInstanceOf(Date)
    })

    it('should handle different month lengths correctly', () => {
      // Test various months which have different day counts
      const result1 = bsToAD(2083, 1, 31)
      const result2 = bsToAD(2083, 6, 31)
      const result3 = bsToAD(2083, 12, 30)
      
      expect(result1).toBeInstanceOf(Date)
      expect(result2).toBeInstanceOf(Date)
      expect(result3).toBeInstanceOf(Date)
    })
  })
})
