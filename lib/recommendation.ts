/**
 * Hotel Recommendation Algorithm
 *
 * Content-based filtering using Cosine Similarity as described in
 * the NepalStay project proposal (Section 4.4.2).
 *
 * Each hotel is represented as a feature vector:
 *   - starRating (normalised 0–1)
 *   - priceRange bucket (0–1)
 *   - city (one-hot encoded)
 *   - propertyType (one-hot encoded)
 *   - amenities (multi-hot encoded)
 *
 * Cosine Similarity(A, B) = (A · B) / (‖A‖ × ‖B‖)
 * Returns the top-N most similar hotels (excluding the query hotel).
 */

const CITIES         = ["Kathmandu", "Pokhara", "Chitwan", "Nagarkot", "Lumbini", "Janakpur", "Other"];
const PROPERTY_TYPES = ["Hotel", "Guesthouse", "Resort", "Hostel", "Lodge"];
const AMENITIES_LIST = ["WiFi", "Parking", "Restaurant", "Pool", "Gym", "Spa", "AC", "Bar", "Garden", "Mountain View"];

type HotelVector = {
  id: string;
  vector: number[];
};

function buildVector(hotel: {
  starRating:   number;
  pricePerNight: number; // average across rooms
  city:         string;
  propertyType: string;
  amenities:    string[];
}): number[] {
  const vec: number[] = [];

  // Star rating normalised (0–1)
  vec.push(hotel.starRating / 5);

  // Price range bucket (0–1, using log scale for better spread)
  const logPrice = Math.log10(Math.max(1, hotel.pricePerNight));
  vec.push(Math.min(1, logPrice / 4)); // log10(10000) ≈ 4

  // City one-hot
  for (const city of CITIES) {
    vec.push(hotel.city === city ? 1 : 0);
  }

  // Property type one-hot
  for (const type of PROPERTY_TYPES) {
    vec.push(hotel.propertyType === type ? 1 : 0);
  }

  // Amenities multi-hot
  for (const amenity of AMENITIES_LIST) {
    vec.push(hotel.amenities.includes(amenity) ? 1 : 0);
  }

  return vec;
}

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

function magnitude(v: number[]): number {
  return Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
}

function cosineSimilarity(a: number[], b: number[]): number {
  const mag = magnitude(a) * magnitude(b);
  if (mag === 0) return 0;
  return dotProduct(a, b) / mag;
}

/**
 * Given a query hotel and a list of candidate hotels,
 * returns the top N most similar (excluding the query itself).
 */
export function getRecommendations<T extends {
  id: string;
  starRating: number;
  city: string;
  propertyType: string;
  amenities: string[];
  avgPrice: number;
}>(
  queryHotel: T,
  allHotels: T[],
  topN = 6
): T[] {
  const queryVec = buildVector({
    starRating:    queryHotel.starRating,
    pricePerNight: queryHotel.avgPrice,
    city:          queryHotel.city,
    propertyType:  queryHotel.propertyType,
    amenities:     queryHotel.amenities,
  });

  const scored = allHotels
    .filter((h) => h.id !== queryHotel.id)
    .map((h) => {
      const vec = buildVector({
        starRating:    h.starRating,
        pricePerNight: h.avgPrice,
        city:          h.city,
        propertyType:  h.propertyType,
        amenities:     h.amenities,
      });
      return { hotel: h, score: cosineSimilarity(queryVec, vec) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return scored.map((s) => s.hotel);
}
