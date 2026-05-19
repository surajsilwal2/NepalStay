# NepalStay Codebase — Comprehensive Overview

**Project**: NepalStay — Online Hotel Booking Portal  
**Type**: BSc CSIT 7th Semester Project (Tribhuvan University)  
**Tech Stack**: Next.js 14, React 18, TypeScript, Prisma ORM, PostgreSQL, TailwindCSS, Recharts  
**Authentication**: NextAuth.js v4 (JWT strategy)  
**Payment**: Khalti + Stripe integration

---

## 1. USER PROFILE STRUCTURE

### Schema Definition

**File**: [prisma/schema.prisma](prisma/schema.prisma#L74-L115)

```prisma
model User {
  id                String   @id @default(cuid())
  name              String
  email             String   @unique
  password          String
  role              Role     @default(CUSTOMER)  // CUSTOMER | VENDOR | STAFF | ADMIN
  phone             String?
  avatar            String?  // UploadThing URL
  address           String?
  isActive          Boolean  @default(true)

  // Foreign National Profile
  nationality       String   @default("NEPALI")  // NEPALI | FOREIGN
  passportNumber    String?  // Only for foreign nationals
  purposeOfVisit    String?  // LEISURE, BUSINESS, etc. (for FNMIS)

  // Loyalty System
  loyaltyPoints     Int      @default(0)
  loyaltyTier       String   @default("BRONZE")  // BRONZE | SILVER | GOLD | PLATINUM

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  hotel             Hotel?          // if VENDOR: their hotel
  staffHotelId      String?         // if STAFF: assigned hotel ID
  staffHotel        Hotel?          @relation("HotelStaff", fields: [staffHotelId], references: [id])
  bookings          Booking[]
  reviews           Review[]
  wishlist          WishlistItem[]
  roomStatusLogs    RoomStatusLog[]

  @@index([email])
  @@index([role])
  @@index([nationality])
}
```

### User Profile API

**File**: [app/api/user/profile/route.ts](app/api/user/profile/route.ts)

**Endpoints**:

- `GET /api/user/profile` — Fetch authenticated user profile
- `PATCH /api/user/profile` — Update user profile (name, phone, address, avatar)

**Validation**:

```typescript
{
  name: z.string().min(2),
  phone: z.string().nullish(),
  address: z.string().nullish(),
  avatar: z.string().url().nullish(),
}
```

**Selected Fields**: id, name, email, phone, address, avatar, role, createdAt

### Customer Profile UI

**File**: [app/customer/profile/page.tsx](app/customer/profile/page.tsx)

**Features**:

- Avatar upload (UploadThing integration)
- Profile info edit (name, phone, address)
- Role badge display
- Loyalty card component
- Recent bookings link
- Wishlist link

**Session Integration**: Uses `useSession()` from NextAuth and `update()` to refresh profile after changes.

---

## 2. TOURISM/ANALYTICS DASHBOARD

### Admin Dashboard

**File**: [app/admin/page.tsx](app/admin/page.tsx)

**Components**:

- Alert banners for:
  - Pending hotel approvals
  - Pending refunds
  - Overdue FNMIS reports
- Stat cards: Total hotels, users, bookings, revenue trends
- Room status breakdown (AVAILABLE, OCCUPIED, CLEANING, MAINTENANCE)
- Link buttons to action pages

**Data Source**: `GET /api/admin/stats`

---

### Tourism Statistics Dashboard

**File**: [app/stats/page.tsx](app/stats/page.tsx)

**Dashboard Type**: Public-facing tourism analytics

**Key Metrics**:

```typescript
type Stats = {
  overview: {
    totalHotels: number;
    totalBookings: number;
    totalVisitors: number;
    monthBookings: number;
    bookingGrowth: number;
    foreignGuests: number;
  };
  byCity: Array<{ city: string; hotels: number }>;
  byType: Array<{ type: string; count: number }>;
  topHotels: Array<{
    id: string;
    name: string;
    city: string;
    starRating: number;
    images: string[];
    slug: string;
    bookingCount: number;
    reviewCount: number;
  }>;
  generatedAt: string;
};
```

**Visualizations**:

- **Bar Charts**: Bookings by city, revenue by city
- **Pie Charts**: Bookings by property type, revenue by region
- **Stat Cards**: Hotels, bookings, visitors, growth percentage
- **Top Hotels**: Featured listings with ratings

**Tech**: Recharts (ResponsiveContainer, BarChart, PieChart, LineChart)

---

### Vendor Analytics Dashboard

**File**: [app/vendor/analytics/page.tsx](app/vendor/analytics/page.tsx)

**Key Performance Indicators (KPI)**:

```typescript
type KPI = {
  totalRevenue: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  revenueGrowth: number;
  totalBookings: number;
  occupancyRate: number;
  avgBookingValue: number;
  avgNightsPerBooking: number;
  nepaliGuests: number;
  foreignGuests: number;
  totalReviews: number;
  overallRating: number | null;
};
```

**Charts**:

- **Line Chart**: Revenue by month with booking count overlay
- **Bar Chart**: Bookings by day (rolling 30 days)
- **Pie Chart**: Room performance breakdown
- **Stacked Charts**: Guest nationality distribution, payment methods

**Data Endpoint**: `GET /api/vendor/analytics`

---

### Admin Stats API

**File**: [app/api/admin/stats/route.ts](app/api/admin/stats/route.ts)

**Response Data**:

```json
{
  "success": true,
  "data": {
    "totalHotels": number,
    "pendingHotels": number,
    "approvedHotels": number,
    "totalUsers": number,
    "totalBookings": number,
    "pendingBookings": number,
    "revenueThisMonth": number,
    "revenueLastMonth": number,
    "revenueGrowth": number (percent),
    "pendingRefunds": number,
    "fnmisPending": number,
    "rooms": { "AVAILABLE": number, "OCCUPIED": number, ... }
  }
}
```

**Implementation Approach**:

- Uses Prisma aggregations (`_sum`, `_count`)
- Date-based filtering (current month vs. previous month)
- Index queries: status, createdAt
- Caching via React Query (5-minute stale time)

---

### Vendor Stats API

**File**: [app/api/vendor/stats/route.ts](app/api/vendor/stats/route.ts)

**Returns**:

```json
{
  "hotelStatus": "APPROVED",
  "totalBookings": number,
  "pendingBookings": number,
  "activeGuests": number (CHECKED_IN),
  "revenueThisMonth": number,
  "refundsThisMonth": number,
  "netRevenueThisMonth": number,
  "revenueLastMonth": number,
  "revenueGrowth": number (percent),
  "totalReviews": number,
  "rooms": {
    "total": number,
    "AVAILABLE": number,
    "OCCUPIED": number,
    "CLEANING": number,
    "MAINTENANCE": number
  }
}
```

---

## 3. FNMIS SYSTEM (Foreign National Management Information System)

### Schema

**File**: [prisma/schema.prisma](prisma/schema.prisma#L234-L246)

```prisma
// FNMIS fields on Booking model
fnmisDeadline     DateTime?   // 24 hours from check-in
fnmisReported     Boolean  @default(false)
fnmisReportedAt   DateTime?
fnmisOverdue      Boolean  @default(false)  // Deadline passed, not reported
fnmisAutoReported Boolean  @default(false)  // Auto-reported via cron
```

**Dependent Fields on User**:

- `nationality` (NEPALI | FOREIGN)
- `passportNumber` (required for foreign nationals)
- `purposeOfVisit` (LEISURE, BUSINESS, etc.)

### FNMIS API

**File**: [app/api/fnmis/route.ts](app/api/fnmis/route.ts)

**Endpoints**:

1. **POST** `/api/fnmis` — Manually report a foreign guest to Tourist Police
   - Required: `bookingId`
   - Authorization: ADMIN, STAFF, VENDOR
   - Updates: `fnmisReported`, `fnmisReportedAt`, `fnmisOverdue`, `fnmisAutoReported`

2. **GET** `/api/fnmis` — List unreported/overdue foreign guests
   - Authorization: ADMIN, STAFF, VENDOR
   - Filters: `passportNumber NOT NULL`, status in [CONFIRMED, CHECKED_IN, CHECKED_OUT]
   - Response includes: `isOverdue`, `hoursLeft` (calculated in memory)

### FNMIS Admin Dashboard

**File**: [app/admin/fnmis/page.tsx](app/admin/fnmis/page.tsx)

**Features**:

- Summary cards: Total, Pending, Overdue (>24h), Reported
- Filter tabs: ALL, PENDING, OVERDUE, REPORTED
- List view with guest details (name, email, hotel, room)
- Manual report action button
- Refresh button to reload data
- Real-time overdue status calculation

**Business Logic**:

- **Reporting Deadline**: 24 hours from check-in (derived from `checkIn + 24h`)
- **Overdue Calculation**: `!fnmisReported && fnmisDeadline < now`
- **Hours Left**: `Math.max(0, (fnmisDeadline - now) / 3600000)`

---

## 4. VENDOR MANAGEMENT

### Hotel Model

**File**: [prisma/schema.prisma](prisma/schema.prisma#L131-L189)

```prisma
model Hotel {
  id          String      @id @default(cuid())
  vendorId    String      @unique  // Links to User (VENDOR role)
  vendor      User        @relation(fields: [vendorId], references: [id])

  name        String      @unique
  slug        String      @unique  // URL-friendly slug
  description String
  status      HotelStatus @default(PENDING)  // PENDING | APPROVED | REJECTED | SUSPENDED

  // Location
  city        String  // Pokhara, Kathmandu, Chitwan, Nagarkot, etc.
  address     String
  latitude    Float?  // For Leaflet map
  longitude   Float?

  // Details
  starRating  Int         @default(3)   // 1–5 stars
  propertyType String     @default("Hotel")  // Hotel, Guesthouse, Resort, Hostel, Lodge
  amenities   String[]    // JSON array: ["WiFi", "Parking", "Restaurant", "Pool", ...]
  images      String[]    // UploadThing URLs
  policies    Json?       // { checkIn, checkOut, cancellation }

  // Contact
  contactPhone String?
  contactEmail String?
  website      String?

  // Hotel Size Management
  hotelSize    String      @default("SMALL")  // SMALL | MEDIUM | LARGE
  staffEnabled Boolean     @default(false)    // Auto-enabled at 12+ rooms

  // Admin Metadata
  approvedAt  DateTime?
  approvedBy  String?    // Admin userId
  rejectionReason String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  rooms       Room[]
  bookings    Booking[]
  reviews     Review[]
  staff       User[]    @relation("HotelStaff")
  wishlist    WishlistItem[]

  @@index([city])
  @@index([status])
  @@index([starRating])
  @@index([slug])
  @@index([hotelSize])
}
```

### Vendor Hotel Management API

**File**: [app/api/vendor/hotel/route.ts](app/api/vendor/hotel/route.ts)

**Endpoints**:

1. **GET** `/api/vendor/hotel` — Get vendor's own hotel
   - Returns: Full hotel with rooms, reviews, staff members
   - Includes counts: bookings, reviews

2. **POST** `/api/vendor/hotel` — Create new hotel listing
   - Authorization: VENDOR only
   - Validation: Name, description (20+ chars), city, address
   - Status: PENDING (awaits admin approval)
   - Slug generation: `{name}-{city}-{randomSuffix}` (ensures uniqueness)
   - One hotel per vendor (enforced)

3. **PUT** `/api/vendor/hotel` — Update existing hotel
   - Authorization: VENDOR or ADMIN
   - Allows partial updates
   - Preserves slug and status

**Validation Schema**:

```typescript
{
  name: z.string().min(3),
  description: z.string().min(20),
  city: z.string().min(2),
  address: z.string().min(5),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  starRating: z.number().int().min(1).max(5).default(3),
  propertyType: z.string().default("Hotel"),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  website: z.string().optional(),
  policies: { checkIn, checkOut, cancellation }.optional(),
}
```

### Vendor Hotel UI

**File**: [app/vendor/hotel/page.tsx](app/vendor/hotel/page.tsx)

**Form Fields**:

- Hotel name, description
- City selector (11 major cities)
- Address, latitude/longitude
- Star rating (1–5)
- Property type (Hotel, Guesthouse, Resort, Hostel, Lodge, Boutique Hotel)
- Contact phone, email, website
- Image upload (UploadThing)
- Amenities multi-select (WiFi, Parking, Restaurant, Pool, Gym, Spa, etc.)
- Check-in/check-out times
- Cancellation policy

**Status Display**:

- PENDING: "Under review by admin"
- APPROVED: "Live and accepting bookings"
- REJECTED: "Resubmit after updating"
- SUSPENDED: "Contact admin"

---

### Vendor Rooms Management API

**File**: [app/api/vendor/rooms/route.ts](app/api/vendor/rooms/route.ts)

**Endpoints**:

1. **GET** `/api/vendor/rooms` — List vendor's hotel rooms
   - Returns rooms with booking count
   - Ordered by: floor, name
   - Includes hotel name

2. **POST** `/api/vendor/rooms` — Create room
   - Authorization: VENDOR only
   - Prerequisite: Hotel must be APPROVED
   - Validation: Room type enum, price, capacity, floor

**Room Schema Validation**:

```typescript
{
  name: z.string().min(2),
  type: z.enum(["SINGLE", "DOUBLE", "TWIN", "DELUXE", "SUITE", "PENTHOUSE", "DORMITORY"]),
  pricePerNight: z.number().positive(),
  capacity: z.number().int().min(1).max(20),
  floor: z.number().int().min(0),
  totalRooms: z.number().int().min(1).default(1),
  description: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
}
```

---

### Public Hotels Listing API

**File**: [app/api/hotels/route.ts](app/api/hotels/route.ts)

**GET** `/api/hotels` — Public hotel search (APPROVED only)

**Query Parameters**:

- `city` — Filter by city
- `q` — Full-text search (name, description, address, city)
- `stars` — Star rating
- `type` — Property type
- `minPrice` / `maxPrice` — Price range filter
- `amenities` — Comma-separated amenities
- `page` / `limit` — Pagination (default: 50 per page)

**Response** includes:

- Hotel details
- Min price (from available rooms)
- Average review score
- Review count
- Pagination metadata

---

## 5. STAFF MANAGEMENT

### Staff Model

**File**: [prisma/schema.prisma](prisma/schema.prisma#L74-L102)

Staff members are stored in the User model with:

- `role: "STAFF"`
- `staffHotelId` — Foreign key to assigned hotel
- Relation via `Hotel.staff` (one-to-many)

### Staff Rooms API

**File**: [app/api/staff/rooms/route.ts](app/api/staff/rooms/route.ts)

**GET** `/api/staff/rooms` — Get staff's assigned hotel rooms

- Authorization: STAFF only
- Returns: Rooms for staff's assigned hotel ONLY (strict filtering)
- Includes: Hotel name
- Ordered by: floor, name
- Filters: `isActive: true`

**Security**: Staff cannot access other hotels' rooms.

---

### Staff Room Status Update API

**File**: [app/api/staff/rooms/{id}/status/route.ts](app/api/staff/rooms/[id]/status/route.ts)

**PATCH** `/api/staff/rooms/{roomId}/status` — Update room status

**Allowed Statuses**: AVAILABLE, OCCUPIED, CLEANING, MAINTENANCE

**Creates**: RoomStatusLog entry with:

- roomId
- updatedBy (user ID)
- status
- notes
- createdAt timestamp

---

### Staff Dashboard UI

**File**: [app/staff/page.tsx](app/staff/page.tsx)

**Tabs**:

1. **Rooms** — Interactive room status board
   - Display all rooms by floor
   - Status color indicators
   - Quick action buttons to change status
   - Optimistic UI updates

2. **Check-ins** — Active bookings
   - Upcoming/current check-ins
   - Guest details
   - Room info
   - Status update buttons

**Features**:

- Real-time room status display
- Pessimistic updates with error handling
- Room skeleton loading
- Booking fetch with pagination

---

## 6. BOOKING MODELS

### Booking Schema

**File**: [prisma/schema.prisma](prisma/schema.prisma#L219-L274)

```prisma
model Booking {
  id        String        @id @default(cuid())
  userId    String
  user      User          @relation(fields: [userId], references: [id])
  hotelId   String
  hotel     Hotel         @relation(fields: [hotelId], references: [id])
  roomId    String
  room      Room          @relation(fields: [roomId], references: [id])

  // Loyalty & Discounts
  pointsEarned     Int?        // Points earned from this booking
  pointsRedeemed   Int?        // Points used as discount
  discountAmount   Float?      // Discount from loyalty points
  carbonKg         Float?      // Carbon footprint tracking

  // Dates & Guests
  checkIn   DateTime
  checkOut  DateTime
  nights    Int
  adults    Int           @default(1)
  children  Int           @default(0)
  notes     String?
  status    BookingStatus @default(PENDING)  // PENDING | CONFIRMED | CHECKED_IN | CHECKED_OUT | CANCELLED | NO_SHOW
  totalPrice Float

  // Payment
  paymentMethod  PaymentMethod  @default(CASH)  // KHALTI | CASH | STRIPE
  paymentStatus  PaymentStatus  @default(UNPAID)  // UNPAID | PAID | REFUNDED | PARTIALLY_REFUNDED
  khaltiPidx     String?        // Khalti payment ID
  khaltiTransactionId String?
  stripeSessionId String?
  paidAt         DateTime?
  invoiceNumber  String?  @unique
  invoiceIssuedAt DateTime?

  // Refund Handling
  refundStatus   RefundStatus @default(NONE)  // NONE | PENDING | COMPLETED | NOT_ELIGIBLE
  refundAmount   Float?
  refundPercent  Int?       // Refund percentage (0-100)
  refundedAt     DateTime?
  creditNoteRef  String?

  // FNMIS — Foreign National Reporting
  fnmisDeadline     DateTime?
  fnmisReported     Boolean  @default(false)
  fnmisReportedAt   DateTime?
  fnmisOverdue      Boolean  @default(false)
  fnmisAutoReported Boolean  @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  creditNote CreditNote?

  @@index([userId])
  @@index([hotelId])
  @@index([roomId])
  @@index([status])
  @@index([checkIn, checkOut])
  @@index([invoiceNumber])
}
```

### Booking Business Logic

**File**: [lib/booking.ts](lib/booking.ts)

**Key Functions**:

1. **Conflict Detection**:

```typescript
checkBookingConflict(roomId, checkIn, checkOut, excludeBookingId?): Promise<boolean>
```

- Algorithm: Two bookings overlap when:
  - `requestedCheckIn < existingCheckOut` AND `requestedCheckOut > existingCheckIn`
- Transaction isolation: SERIALIZABLE (prevents race conditions)

2. **Night Calculation**:

```typescript
calculateNights(checkIn: Date, checkOut: Date): number
// Returns: Math.max(1, differenceInCalendarDays(checkOut, checkIn))
```

3. **Price Calculation**:

```typescript
calculateTotalPrice(pricePerNight, checkIn, checkOut): number
// Returns: calculateNights(checkIn, checkOut) * pricePerNight
```

4. **Cancellation Policy**:

```typescript
getCancellationPolicy(checkIn: Date): { percent, description, daysToCheckIn }
```

- **>7 days before**: 100% refund
- **3–7 days**: 50% refund
- **<3 days**: 0% refund

5. **Invoice Generation**:

```typescript
generateInvoiceNumber(bookingId, amount): string
// Format: INV-{last8ofId}-{paddedAmount}
```

---

### Booking API

**File**: [app/api/bookings/route.ts](app/api/bookings/route.ts)

**Endpoints**:

1. **GET** `/api/bookings` — List bookings (role-based filtering)
   - CUSTOMER: Only own bookings
   - VENDOR: Only their hotel's bookings
   - STAFF: Only their assigned hotel's bookings
   - ADMIN: All bookings (with optional hotelId filter)
   - Query params: `status`, `page`, `limit`
   - Includes: User, hotel, room details
   - Response: Array + total count

2. **POST** `/api/bookings` — Create new booking
   - Validation: Check-in > now, check-out > check-in
   - Conflict check: Call `checkBookingConflict()`
   - Calculate: nights, totalPrice
   - Status: PENDING (awaits confirmation/payment)
   - Loyalty: Calculate points earned based on tier
   - FNMIS: Set deadline for foreign nationals (+24h)
   - Transaction: SERIALIZABLE isolation

**Validation Schema**:

```typescript
{
  hotelId: z.string(),
  roomId: z.string(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  adults: z.number().int().min(1).default(1),
  children: z.number().int().min(0).default(0),
  notes: z.string().nullish(),
}
.refine(d => new Date(d.checkOut) > new Date(d.checkIn), {
  message: "Check-out must be after check-in",
})
```

---

### Booking Individual/Refund APIs

**File**: [app/api/bookings/{id}/route.ts](app/api/bookings/[id]/route.ts)

- **GET** — Fetch single booking details
- **PATCH** — Update booking status (by staff/vendor/admin)
- **DELETE** — Cancel booking

**File**: [app/api/bookings/{id}/refund/route.ts](app/api/bookings/[id]/refund/route.ts)

- **POST** — Process refund
  - Validate cancellation policy
  - Create CreditNote
  - Update refundStatus, refundAmount, refundedAt

---

### Credit Note Model

**File**: [prisma/schema.prisma](prisma/schema.prisma#L276-L296)

```prisma
model CreditNote {
  id               String   @id @default(cuid())
  creditNoteNumber String   @unique
  bookingId        String   @unique
  booking          Booking  @relation(fields: [bookingId], references: [id])
  originalInvoice  String
  guestName        String
  guestEmail       String
  hotelName        String
  roomName         String
  originalAmount   Float
  refundAmount     Float
  refundPercent    Int
  reason           String
  cancellationPolicy String
  issuedAt         DateTime @default(now())
  issuedBy         String?
  notes            String?

  @@index([bookingId])
  @@index([issuedAt])
}
```

---

## 7. LOYALTY SYSTEM

### Loyalty Tiers

**File**: [lib/loyalty.ts](lib/loyalty.ts)

```typescript
const TIERS = {
  BRONZE: {
    min: 0,
    label: "Bronze",
    color: "#CD7F32",
    perks: "1 point per NPR 100",
  },
  SILVER: {
    min: 500,
    label: "Silver",
    color: "#C0C0C0",
    perks: "1.5x points + priority support",
  },
  GOLD: {
    min: 2000,
    label: "Gold",
    color: "#FFD700",
    perks: "2x points + free room upgrade request",
  },
  PLATINUM: {
    min: 5000,
    label: "Platinum",
    color: "#E5E4E2",
    perks: "3x points + complimentary breakfast",
  },
};
```

### Loyalty Functions

1. **Point Multiplier by Tier**:

```typescript
getMultiplier(tier): number
// BRONZE: 1x, SILVER: 1.5x, GOLD: 2x, PLATINUM: 3x
```

2. **Calculate Points Earned**:

```typescript
calcPointsEarned(amountNPR: number, tier: string): number
// Formula: Math.floor((amountNPR / 100) * getMultiplier(tier))
// Example: NPR 5000 at GOLD tier = 100 points
```

3. **Calculate Discount from Points**:

```typescript
calcDiscount(pointsToRedeem: number): number
// 1 point = NPR 0.5 discount
// Example: 100 points = NPR 50 discount
```

4. **Get Tier by Points**:

```typescript
getTierByPoints(points: number): string
// PLATINUM >= 5000, GOLD >= 2000, SILVER >= 500, else BRONZE
```

### Loyalty Integration in Bookings

- Points earned and stored in `Booking.pointsEarned`
- Points redeemed stored in `Booking.pointsRedeemed`
- Discount amount calculated and stored in `Booking.discountAmount`
- User's `loyaltyTier` updated after each booking

---

## 8. PAYMENT SYSTEM

### Payment Enums

```prisma
enum PaymentMethod {
  KHALTI
  CASH
  STRIPE
}

enum PaymentStatus {
  UNPAID
  PAID
  REFUNDED
  PARTIALLY_REFUNDED
}
```

### Khalti Payment Gateway

**File**: [app/api/payment/khalti/route.ts](app/api/payment/khalti/route.ts)

**POST** `/api/payment/khalti` — Initiate Khalti payment

- Validates booking exists and belongs to user
- Checks if not already paid (prevents double payment)
- Converts NPR to paisa (multiply by 100)
- Builds Khalti payload with:
  - return_url
  - website_url
  - amount
  - purchase_order_id (booking ID)
  - customer_info (name, email, phone)
  - product_details

**Khalti Base URL**:

- Production: `https://khalti.com`
- Development: `https://a.khalti.com` (sandbox)
- Configurable via `KHALTI_BASE_URL` env var

---

### Khalti Verification

**File**: [app/api/payment/khalti/verify/route.ts](app/api/payment/khalti/verify/route.ts)

**POST** `/api/payment/khalti/verify` — Verify and finalize payment

- Required: `pidx` (Khalti payment ID), `bookingId`
- Idempotency: Returns existing invoice if already verified
- Calls Khalti API: `POST /api/v2/epayment/lookup/`
- Validates: Status = "Completed", amount matches
- On success:
  - Creates invoice number
  - Updates booking: `paymentStatus: PAID`, `paidAt: now()`
  - Issues invoice

---

### Stripe Payment

**File**: [app/api/payment/stripe/route.ts](app/api/payment/stripe/route.ts)

**POST** `/api/payment/stripe` — Create Stripe session

- Creates checkout session with:
  - Line items (room, discount)
  - Customer email
  - success_url, cancel_url

---

### Stripe Webhook Verification

**File**: [app/api/payment/stripe/verify/route.ts](app/api/payment/stripe/verify/route.ts)

**POST** `/api/payment/stripe/verify` — Handle Stripe webhook

- Verifies signature with secret
- Processes: `payment_intent.succeeded`, `charge.refunded`
- Updates booking status accordingly

---

## 9. ADMIN HOTEL APPROVAL

### Admin Hotels API

**File**: [app/api/admin/hotels/route.ts](app/api/admin/hotels/route.ts)

**GET** `/api/admin/hotels` — List hotels for admin review

- Query: `?status=PENDING|APPROVED|REJECTED|SUSPENDED`
- Returns: Full hotel details with vendor info and counts

**File**: [app/api/admin/hotels/{id}/route.ts](app/api/admin/hotels/[id]/route.ts)

- **PATCH** — Approve/reject hotel
  - Updates status
  - Sets approvedAt, approvedBy (admin ID)
  - Stores rejectionReason if applicable

---

### Admin Review System

**File**: [app/api/admin/reviews/route.ts](app/api/admin/reviews/route.ts)

**GET** `/api/admin/reviews` — List all reviews (for moderation)

- Can hide/show inappropriate reviews

---

## 10. AUTHENTICATION & AUTHORIZATION

### NextAuth Configuration

**File**: [lib/auth.ts](lib/auth.ts)

**Session Strategy**: JWT (maxAge: 24 hours)

**Provider**: CredentialsProvider

- Email + password authentication
- Uses bcrypt for password hashing
- Validates `isActive` status

**JWT Callback**: Stores in token:

- id, role, avatar, name
- nationality, passportNumber, purposeOfVisit (for FNMIS)

**Session Callback**: Populates session.user with token data

**Protected Routes**:

- `/admin/*` — role === "ADMIN"
- `/vendor/*` — role === "VENDOR"
- `/staff/*` — role === "STAFF"
- `/customer/*` — Any authenticated user

---

## 11. QUERY & MUTATION HOOKS

### Admin Queries Library

**File**: [lib/queries/admin.ts](lib/queries/admin.ts)

**React Query Hooks**:

- `useAdminStats()` — 5-min cache
- `useHotels(filters)` — 2-min cache
- `useRecentBookings(limit)` — 1-min cache
- `usePendingApprovals(limit)` — 2-min cache
- `useDashboardData()` — Parallel queries

**Caching Strategy**: Stale times vary by data volatility

- Stats: 5 min (stable)
- Hotels: 2 min (moderate)
- Bookings: 1 min (real-time)

---

### Admin Mutations Library

**File**: [lib/mutations/admin.ts](lib/mutations/admin.ts)

_File not fully examined, but likely includes_:

- Hotel approval/rejection
- User management
- Review moderation
- Refund processing

---

## 12. KEY DIRECTORIES & FILES SUMMARY

| Path                                     | Purpose                                                |
| ---------------------------------------- | ------------------------------------------------------ |
| `prisma/schema.prisma`                   | Data models (User, Hotel, Room, Booking, Review, etc.) |
| `app/api/hotels/route.ts`                | Public hotel search API                                |
| `app/api/user/profile/route.ts`          | User profile management                                |
| `app/api/bookings/route.ts`              | Booking CRUD & conflict detection                      |
| `app/api/fnmis/route.ts`                 | Foreign national reporting                             |
| `app/api/vendor/hotel/route.ts`          | Vendor hotel management                                |
| `app/api/vendor/rooms/route.ts`          | Vendor room management                                 |
| `app/api/vendor/stats/route.ts`          | Vendor dashboard metrics                               |
| `app/api/staff/rooms/route.ts`           | Staff room status access                               |
| `app/api/admin/hotels/route.ts`          | Admin hotel approval list                              |
| `app/api/admin/stats/route.ts`           | Admin dashboard metrics                                |
| `app/api/payment/khalti/route.ts`        | Khalti payment initiation                              |
| `app/api/payment/khalti/verify/route.ts` | Khalti payment verification                            |
| `app/admin/page.tsx`                     | Admin dashboard UI                                     |
| `app/vendor/page.tsx`                    | Vendor dashboard UI                                    |
| `app/stats/page.tsx`                     | Public tourism analytics                               |
| `app/vendor/analytics/page.tsx`          | Vendor analytics dashboard                             |
| `app/staff/page.tsx`                     | Staff room/booking panel                               |
| `app/customer/profile/page.tsx`          | Customer profile page                                  |
| `app/admin/fnmis/page.tsx`               | FNMIS compliance dashboard                             |
| `lib/booking.ts`                         | Booking logic (conflicts, pricing, cancellation)       |
| `lib/loyalty.ts`                         | Loyalty tier system                                    |
| `lib/auth.ts`                            | NextAuth configuration                                 |
| `lib/queries/admin.ts`                   | React Query hooks for admin                            |
| `lib/mutations/admin.ts`                 | React Query mutations for admin                        |

---

## 13. DATA FLOW DIAGRAMS

### Booking Creation Flow

```
Customer → Hotel Search (GET /api/hotels)
         → Select Room → Create Booking (POST /api/bookings)
         → Conflict Check (SERIALIZABLE transaction)
         → Calculate Price & Points
         → Set FNMIS Deadline (if foreign)
         → Return Booking (PENDING status)
```

### Payment Flow

```
Customer → Choose Payment Method
         → Khalti: POST /api/payment/khalti
         → Khalti API: Create payment session
         → Return pidx → Customer pays
         → POST /api/payment/khalti/verify (with pidx)
         → Khalti API: Lookup payment status
         → Update Booking: paymentStatus = PAID
         → Generate Invoice
```

### FNMIS Reporting Flow

```
Booking Created (foreign guest)
→ Set fnmisDeadline = checkIn + 24h
→ Cron Job: Check overdue bookings
→ Overdue: fnmisOverdue = true (or fnmisAutoReported = true)
→ Admin/Staff: View FNMIS Dashboard
→ Manual Report: POST /api/fnmis
→ Update: fnmisReported = true, fnmisReportedAt = now
```

### Hotel Approval Flow

```
Vendor → POST /api/vendor/hotel
      → Hotel created with status = PENDING
      → Admin views: GET /api/admin/hotels?status=PENDING
      → Admin: PATCH /api/admin/hotels/{id}
      → Status → APPROVED
      → Vendor can now add rooms
      → Hotel appears in public search
```

---

## 14. TECHNOLOGY STACK SUMMARY

| Layer            | Technology                                 |
| ---------------- | ------------------------------------------ |
| Frontend         | Next.js 14, React 18, TypeScript           |
| Styling          | TailwindCSS, Lucide React icons            |
| Forms            | React Hook Form, Zod                       |
| Charts           | Recharts                                   |
| State Management | React Query (TanStack Query), NextAuth JWT |
| Backend          | Next.js API Routes                         |
| Database         | PostgreSQL (via Prisma)                    |
| ORM              | Prisma                                     |
| Authentication   | NextAuth.js v4                             |
| Payment          | Khalti, Stripe                             |
| File Upload      | UploadThing                                |
| Date Handling    | date-fns                                   |
| Hashing          | bcrypt                                     |
| Testing          | Jest, Lighthouse                           |

---

## 15. SECURITY CONSIDERATIONS

1. **Session Strategy**: JWT with 24-hour expiration
2. **Password Hashing**: bcrypt with salt
3. **Authorization**: Role-based (CUSTOMER, VENDOR, STAFF, ADMIN)
4. **Double Payment Prevention**: Check `paidAt` before processing payment
5. **Idempotent Payment Verification**: Return existing invoice if already verified
6. **FNMIS Compliance**: Automatic deadline tracking and overdue alerting
7. **Room Conflict Detection**: SERIALIZABLE transaction isolation
8. **Staff Access Control**: Staff can only access their assigned hotel's rooms
9. **Vendor Isolation**: Vendors can only manage their own hotel

---

## 16. PERFORMANCE OPTIMIZATIONS

1. **Indexing**: Strategic indexes on frequently queried fields (email, role, city, status, slug, hotelSize, etc.)
2. **Query Aggregation**: Use `_sum`, `_count`, `_avg` for stats instead of full dataset
3. **Pagination**: Implemented on bookings, hotels (default 50/12 per page)
4. **Lazy Loading**: Room data loaded on demand in staff/vendor panels
5. **React Query Caching**: Stale times vary (5min stats, 2min hotels, 1min bookings)
6. **Optimistic UI**: Staff room status updates show immediately, revert on error

---

**Document Generated**: May 19, 2026  
**Project**: NepalStay — BSc CSIT Project (Tribhuvan University)
