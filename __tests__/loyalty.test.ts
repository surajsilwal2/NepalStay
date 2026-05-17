import { calcPointsEarned, getTierByPoints, calcDiscount, TIERS } from '@/lib/loyalty'

describe('Loyalty Points System - Award Points', () => {
  describe('Test 1: Award points - 1 point per NPR 100 (BRONZE tier)', () => {
    it('should calculate 100 points for NPR 10,000 booking in BRONZE tier', () => {
      const amount = 10000 // NPR 10,000
      const tier = 'BRONZE' as const
      const expectedPoints = 100 // 10000 / 100 = 100 points

      const pointsEarned = calcPointsEarned(amount, tier)

      expect(pointsEarned).toBe(expectedPoints)
    })
  })

  describe('Test 2: Award points with tier multiplier (SILVER tier)', () => {
    it('should calculate 150 points for NPR 10,000 booking in SILVER tier (1.5x multiplier)', () => {
      const amount = 10000 // NPR 10,000
      const tier = 'SILVER' as const
      const expectedPoints = 150 // (10000 / 100) * 1.5 = 150 points

      const pointsEarned = calcPointsEarned(amount, tier)

      expect(pointsEarned).toBe(expectedPoints)
    })
  })

  describe('Test 3: Award points with GOLD tier multiplier', () => {
    it('should calculate 200 points for NPR 10,000 booking in GOLD tier (2x multiplier)', () => {
      const amount = 10000 // NPR 10,000
      const tier = 'GOLD' as const
      const expectedPoints = 200 // (10000 / 100) * 2 = 200 points

      const pointsEarned = calcPointsEarned(amount, tier)

      expect(pointsEarned).toBe(expectedPoints)
    })
  })

  describe('Test 4: Award points with odd amounts', () => {
    it('should handle NPR 15,750 correctly (floor operation)', () => {
      const amount = 15750 // NPR 15,750
      const tier = 'BRONZE' as const
      const expectedPoints = 157 // floor(15750 / 100) = 157 points

      const pointsEarned = calcPointsEarned(amount, tier)

      expect(pointsEarned).toBe(expectedPoints)
    })
  })

  describe('Test 5: Tier determination by points', () => {
    it('should identify BRONZE tier for 0-499 points', () => {
      expect(getTierByPoints(0)).toBe('BRONZE')
      expect(getTierByPoints(499)).toBe('BRONZE')
    })

    it('should identify SILVER tier for 500-1999 points', () => {
      expect(getTierByPoints(500)).toBe('SILVER')
      expect(getTierByPoints(1999)).toBe('SILVER')
    })

    it('should identify GOLD tier for 2000-4999 points', () => {
      expect(getTierByPoints(2000)).toBe('GOLD')
      expect(getTierByPoints(4999)).toBe('GOLD')
    })

    it('should identify PLATINUM tier for 5000+ points', () => {
      expect(getTierByPoints(5000)).toBe('PLATINUM')
      expect(getTierByPoints(10000)).toBe('PLATINUM')
    })
  })

  describe('Test 6: Redeem loyalty points - 1 point = NPR 0.5 discount', () => {
    it('should calculate NPR 250 discount for 500 points redemption', () => {
      const pointsToRedeem = 500
      const expectedDiscount = 250 // 500 * 0.5 = NPR 250

      const discount = calcDiscount(pointsToRedeem)

      expect(discount).toBe(expectedDiscount)
    })

    it('should calculate NPR 500 discount for 1000 points redemption', () => {
      const pointsToRedeem = 1000
      const expectedDiscount = 500 // 1000 * 0.5 = NPR 500

      const discount = calcDiscount(pointsToRedeem)

      expect(discount).toBe(expectedDiscount)
    })
  })
})
