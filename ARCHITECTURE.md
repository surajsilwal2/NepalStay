# NepalStay — Architecture & Implementation Guide

> **Online Hotel Booking System for Nepal**  
> BSc CSIT 7th Semester Project | Tribhuvan University · Bhairahawa Multiple Campus

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Data Model](#data-model)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Database Schema](#database-schema)
6. [Hotel Classification](#hotel-classification)
7. [Demo Credentials](#demo-credentials)
8. [Key Features](#key-features)
9. [API Endpoints Overview](#api-endpoints-overview)
10. [Security & Data Isolation](#security--data-isolation)

---

## System Overview

NepalStay is a comprehensive hotel booking platform designed for **small to large hotels** across Nepal. The system recognizes that:

- **Small hotels (8-11 rooms)** don't need complex staff management
- **Medium/Large hotels (12+ rooms)** benefit from staff management and advanced features
- **All hotels** deserve equal recognition and professional presentation

### Key Principles

✅ **Single Nationality Per User** — Users set their nationality once at registration  
✅ **One Hotel Per Vendor** — Vendor-Hotel relationship is 1:1 and unique  
✅ **Unique Room Numbers** — Every room has a unique number per hotel (101, 102, etc.)  
✅ **Unique Room Names** — No duplicate room type names within a hotel  
✅ **Conditional Staff Roles** — Staff management only for hotels with 12+ rooms  
✅ **Image Optimization** — All images are served from CDN with proper sizing  
✅ **Complete Data Isolation** — Users, vendors, staff, and admin data never leak

---

## Architecture

### Tech Stack

- **Framework:** Next.js 14.2+ (App Router)
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma 5.22+
- **Authentication:** NextAuth.js 4.24+
- **UI Library:** React 18.3+
- **Styling:** Tailwind CSS 3.4+
- **Form Handling:** React Hook Form + Zod
- **State Management:** TanStack React Query 5.96+
- **File Upload:** UploadThing 7.4+
- **Payments:** Stripe + Khalti

### Project Structure

```
nepalstay/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (not protected)
│   │   ├── login/
│   │   └── register/
│   ├── api/                      # API routes (server)
│   │   ├── auth/
│   │   ├── hotels/
│   │   ├── bookings/
│   │   ├── vendor/
│   │   ├── staff/
│   │   └── admin/
│   ├── admin/                    # Admin dashboard (role-protected)
│   ├── vendor/                   # Vendor dashboard (role-protected)
│   ├── staff/                    # Staff dashboard (role-protected)
│   ├── customer/                 # Customer dashboard (role-protected)
│   └── page.tsx                  # Public homepage
├── components/                   # Reusable React components
│   ├── ui/                       # UI components (buttons, forms, etc)
│   ├── features/                 # Feature components
│   ├── layout/                   # Layout components
│   └── shared/                   # Shared utilities
├── lib/                          # Utilities & helpers
│   ├── auth.ts                   # NextAuth config
│   ├── prisma.ts                 # Prisma client singleton
│   ├── api.ts                    # API client utilities
│   ├── constants/                # App constants
│   ├── hooks/                    # Custom React hooks
│   ├── mutations/                # React Query mutations
│   └── queries/                  # React Query queries
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Database seed script
├── public/                       # Static assets
└── package.json
```

---

## Data Model

### Core Entities

#### 1. User
Stores all user information including role and nationality.

```typescript
model User {
  id                String   @id @default(cuid())
  name              String
  email             String   @unique
  password          String (bcrypt hashed)
  role              Role     @default(CUSTOMER)  // CUSTOMER | VENDOR | STAFF | ADMIN
  
  // Profile
  phone             String?
  avatar            String?
  address           String?
  nationality       String   @default("NEPALI")  // NEPALI | FOREIGN
  passportNumber    String?  // Only for foreign nationals
  purposeOfVisit    String?  // For foreign tourists
  
  // Loyalty
  loyaltyPoints     Int      @default(0)
  loyaltyTier       String   @default("BRONZE")
  
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

#### 2. Hotel
Represents a physical hotel property.

```typescript
model Hotel {
  id                String      @id @default(cuid())
  
  // Vendor relationship (1:1, unique)
  vendorId          String      @unique
  vendor            User        @relation(...)
  
  // Basic info
  name              String      @unique  // Hotel names must be unique
  slug              String      @unique  // URL-friendly
  description       String
  status            HotelStatus @default(PENDING) // PENDING | APPROVED | REJECTED | SUSPENDED
  
  // Location
  city              String
  address           String
  latitude          Float?
  longitude         Float?
  
  // Details
  starRating        Int         @default(3)  // 1-5
  propertyType      String                   // Hotel, Guesthouse, Resort, etc
  amenities         String[]                 // ["WiFi", "Parking", ...]
  images            String[]                 // CDN URLs
  policies          Json?                    // Check-in, check-out, cancellation
  
  // Hotel Classification
  hotelSize         String      @default("SMALL")  // SMALL | MEDIUM | LARGE
  staffEnabled      Boolean     @default(false)    // Auto-enabled at 12+ rooms
  
  // Admin
  approvedAt        DateTime?
  approvedBy        String?
  rejectionReason   String?
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}
```

#### 3. Room
Represents individual hotel rooms with unique numbering.

```typescript
model Room {
  id                String     @id @default(cuid())
  
  // Hotel reference
  hotelId           String
  hotel             Hotel      @relation(...)
  
  // Unique identifiers (per hotel)
  roomNumber        String     // "101", "G05", "301"
  name              String     // "Deluxe Mountain View", "Budget Single"
  
  // Classification
  type              RoomType   // SINGLE | DOUBLE | TWIN | DELUXE | SUITE | PENTHOUSE | DORMITORY
  status            RoomStatus @default(AVAILABLE)
  floor             Int
  
  // Pricing & Capacity
  pricePerNight     Float
  capacity          Int        @default(2)
  totalRooms        Int        @default(1)  // Number of identical units
  
  // Details
  description       String?
  amenities         String[]
  images            String[]
  isActive          Boolean    @default(true)
  peakMultiplier    Float      @default(1.0)
  
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
  
  // Constraints
  @@unique([hotelId, roomNumber])  // Room numbers unique per hotel
  @@unique([hotelId, name])        // Room names unique per hotel
}
```

#### 4. Booking
Represents a hotel reservation.

```typescript
model Booking {
  id                String        @id @default(cuid())
  
  // References (user's nationality comes from User model)
  userId            String
  user              User          @relation(...)
  hotelId           String
  hotel             Hotel         @relation(...)
  roomId            String
  room              Room          @relation(...)
  
  // Booking Details
  checkIn           DateTime
  checkOut          DateTime
  nights            Int
  adults            Int           @default(1)
  children          Int           @default(0)
  notes             String?
  status            BookingStatus
  totalPrice        Float
  
  // Payment
  paymentMethod     PaymentMethod @default(CASH)
  paymentStatus     PaymentStatus @default(UNPAID)
  khaltiPidx        String?
  paidAt            DateTime?
  invoiceNumber     String?       @unique
  
  // Loyalty & Discounts
  pointsEarned      Int?
  pointsRedeemed    Int?
  discountAmount    Float?        @default(0)
  carbonKg          Float?
  
  // FNMIS (Foreign guest compliance - uses User.nationality)
  fnmisDeadline     DateTime?
  fnmisReported     Boolean       @default(false)
  fnmisReportedAt   DateTime?
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
}
```

---

## User Roles & Permissions

### 1. CUSTOMER
📱 Regular user booking hotels

**Capabilities:**
- Register with nationality (NEPALI | FOREIGN)
- Browse & search hotels
- View room availability
- Make bookings
- Make payments (Khalti, Stripe, Cash)
- Write reviews (after checkout)
- Manage wishlist
- Track loyalty points

**Data Access:**
- Own profile only
- All public hotels & rooms
- Own bookings only

---

### 2. VENDOR
🏢 Hotel owner/manager

**Capabilities:**
- Register and list one hotel
- Upload hotel photos & details
- Set room prices & availability
- Manage room inventory
- View booking requests for their hotel
- Generate invoices
- View analytics for their hotel

**Data Access:**
- Own hotel only
- Own bookings only
- Staff assigned to their hotel

**Restrictions:**
- ❌ Cannot see other vendors' data
- ❌ Cannot change hotel status (admin only)
- ❌ Cannot manage staff directly (if staffEnabled=true)

---

### 3. STAFF
👥 Hotel employee (only for hotels with 12+ rooms)

**Capabilities:**
- Login to staff dashboard
- View room status for their hotel
- Update room maintenance status
- Process check-ins/check-outs
- View guest information for their hotel

**Data Access:**
- Assigned hotel only
- Bookings for their hotel only
- Guest info for checking-in guests

**Restrictions:**
- ❌ Cannot access other hotels
- ❌ Cannot change prices
- ❌ Cannot accept/reject bookings

---

### 4. ADMIN
🔐 System administrator

**Capabilities:**
- Approve/reject hotel applications
- Suspend problematic hotels
- View all bookings system-wide
- View all users
- Generate system reports
- Manage admins
- View audit logs

**Data Access:**
- All data (unrestricted)

**Unique Powers:**
- ✅ Approve/reject hotel status
- ✅ Suspend hotels
- ✅ View audit trails
- ✅ System-wide reports

---

## Database Schema

### Enums

```typescript
enum Role {
  CUSTOMER
  VENDOR
  STAFF
  ADMIN
}

enum HotelStatus {
  PENDING    // Awaiting admin review
  APPROVED   // Live and bookable
  REJECTED   // Permanently rejected
  SUSPENDED  // Temporarily closed
}

enum RoomType {
  SINGLE
  DOUBLE
  TWIN
  DELUXE
  SUITE
  PENTHOUSE
  DORMITORY
}

enum RoomStatus {
  AVAILABLE
  OCCUPIED
  CLEANING
  MAINTENANCE
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CHECKED_IN
  CHECKED_OUT
  CANCELLED
  NO_SHOW
}

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

### Indexes for Performance

```prisma
// User
@@index([email])
@@index([role])
@@index([nationality])

// Hotel
@@index([city])
@@index([status])
@@index([starRating])
@@index([slug])
@@index([hotelSize])

// Room
@@unique([hotelId, roomNumber])   // Prevent duplicate room numbers
@@unique([hotelId, name])         // Prevent duplicate room names
@@index([hotelId])
@@index([status])
@@index([type])

// Booking
@@index([userId])
@@index([hotelId])
@@index([roomId])
@@index([status])
@@index([checkIn, checkOut])
@@index([invoiceNumber])
```

---

## Hotel Classification

### Small Hotel
**Criteria:** 1-11 rooms

**Characteristics:**
- `hotelSize = "SMALL"`
- `staffEnabled = false`
- Vendor manages everything directly
- Perfect for family-run hotels

**Example:** Urban Kathmandu Boutique (8 rooms, 2 floors)

---

### Medium Hotel
**Criteria:** 12-30 rooms

**Characteristics:**
- `hotelSize = "MEDIUM"`
- `staffEnabled = true`
- Can add 1-2 staff members
- Vendor still handles business decisions

**Scaling Note:** As rooms exceed 12, vendor receives notification to enable staff.

---

### Large Hotel
**Criteria:** 31+ rooms

**Characteristics:**
- `hotelSize = "LARGE"`
- `staffEnabled = true`
- Multiple staff members for different shifts
- Operations management becomes critical

**Example:** Pokhara Mountain Lodge (32 rooms, 4 levels)

---

## Demo Credentials

### Environments

#### Administrator
```
Email:    admin@nepalstay.com
Password: admin123
Role:     ADMIN
```

#### Vendors

**Small Hotel Owner**
```
Email:    rajesh@urbanboutique.com
Password: password123
Hotel:    Urban Kathmandu Boutique (8 rooms)
```

**Large Hotel Owner**
```
Email:    sita@mountainlodge.com
Password: password123
Hotel:    Pokhara Mountain Lodge (32 rooms)
```

#### Staff

**Small Hotel Staff**
```
Email:    ramesh@urbanboutique.com
Password: password123
Hotel:    Urban Kathmandu Boutique
Role:     STAFF (no staff features enabled for this hotel)
```

**Large Hotel Staff**
```
Email:    maya@mountainlodge.com
Password: password123
Hotel:    Pokhara Mountain Lodge
Role:     STAFF (staff features enabled)
```

#### Customers

**Nepali Tourist**
```
Email:    traveler@example.com
Password: password123
Nationality: NEPALI
```

**Foreign Tourist**
```
Email:    foreign@example.com
Password: password123
Nationality: FOREIGN
Passport:  GB123456
Purpose:   LEISURE
```

---

## Key Features

### 1. Nationality-Based Pricing
- Foreign tourists may have different pricing
- Stored once per user, not per booking
- Used for FNMIS compliance reporting

### 2. Dynamic Staff Management
- Automatically enable staff features at 12 rooms
- Small hotels remain simple and vendor-managed
- Scales with hotel growth

### 3. Room Uniqueness
- Every room has a unique number (101, G05, etc)
- Every room has a unique name per hotel
- Database constraints enforce this

### 4. Image Optimization
- All images served from CDN (Unsplash/UploadThing)
- Properly sized (800x600 for thumbnails, 1200x800 for details)
- Format: JPEG/WebP
- Minimal loading times

### 5. Complete Data Isolation
- Vendors only see their hotel
- Staff only see their hotel
- Users only see own bookings
- Row-Level Security at API level

### 6. FNMIS Compliance
- Foreign guest nationality tracked at user level
- Passport info collected during registration
- Purpose of visit recorded
- Automatic reporting deadlines

---

## API Endpoints Overview

### Authentication
```
POST   /api/auth/register         # Register new user (with nationality)
POST   /api/auth/login            # Login credentials
POST   /api/auth/logout           # Logout
GET    /api/auth/session          # Current user session
```

### Hotels (Public)
```
GET    /api/hotels                # Search & filter hotels
GET    /api/hotels/[slug]         # Hotel details with rooms
GET    /api/hotels/[slug]/rooms   # Available rooms
```

### Vendor Dashboard
```
GET    /api/vendor/hotel          # Own hotel (1:1 lookup)
PATCH  /api/vendor/hotel          # Update hotel details
GET    /api/vendor/bookings       # Bookings for own hotel
GET    /api/vendor/analytics      # Hotel analytics
```

### Staff Dashboard
```
GET    /api/staff/rooms           # Rooms in assigned hotel
PATCH  /api/staff/room/[id]       # Update room status
GET    /api/staff/bookings        # Check-ins/check-outs
```

### Admin Dashboard
```
GET    /api/admin/hotels          # All hotels with status
PATCH  /api/admin/hotel/[id]/approve      # Approve hotel
PATCH  /api/admin/hotel/[id]/reject       # Reject hotel
PATCH  /api/admin/hotel/[id]/suspend      # Suspend hotel
GET    /api/admin/bookings        # All bookings
GET    /api/admin/users           # All users
GET    /api/admin/reports         # System reports
```

### Bookings
```
POST   /api/bookings              # Create booking
GET    /api/bookings/[id]         # Booking details
PATCH  /api/bookings/[id]         # Update booking status
POST   /api/bookings/[id]/payment # Process payment
```

---

## Security & Data Isolation

### Authentication
- NextAuth.js with credentials provider
- Passwords hashed with bcrypt (12 rounds)
- Session tokens stored securely
- CSRF protection enabled

### Authorization
- Role-based access control (RBAC)
- Row-level security at API level
- Vendors can only access their hotel
- Staff can only access assigned hotel
- Customers can only access own bookings

### Data Validation
- Zod schemas for all inputs
- Input sanitization
- SQL injection prevention (Prisma ORM)
- XSS protection via React

### API Security
- CORS properly configured
- Rate limiting on auth endpoints
- No sensitive data in URLs
- Environment variables for secrets
- HTTPS enforcement in production

### Audit Trail
- All admin actions logged
- Booking history maintained
- Staff actions tracked
- User activity logged (optional)

---

## Deployment Checklist

- [ ] Environment variables configured (.env.local)
- [ ] Database migrations applied
- [ ] Seed data loaded (if development)
- [ ] Admin account created
- [ ] SSL certificates installed
- [ ] CORS whitelist configured
- [ ] Email service configured
- [ ] Payment gateways configured (Khalti, Stripe)
- [ ] CDN images verified
- [ ] Rate limiting enabled
- [ ] Monitoring & logging setup
- [ ] Backup strategy implemented

---

## Contact

**Project Lead:** [Your Name]  
**Institution:** Tribhuvan University · Bhairahawa Multiple Campus  
**Year:** 2026

---

**Last Updated:** May 18, 2026
