# NepalStay — Online Hotel Booking System# NepalStay — Online Hotel Booking Portal



> An innovative hotel booking platform designed for both small and large hotels across Nepal.  **BSc CSIT 7th Semester Project**

> **BSc CSIT 7th Semester Project** | Tribhuvan University · Bhairahawa Multiple CampusTribhuvan University · Bhairahawa Multiple Campus



---A full-stack hotel booking marketplace built for Nepal's hospitality market.

Search, compare, and book hotels across Kathmandu, Pokhara, Chitwan, and beyond.

## 🚀 Quick Start

Live demo: [nepal-stay.vercel.app](https://nepal-stay.vercel.app)

### Prerequisites

- Node.js 18+ and npm---

- PostgreSQL database

- Environment variables configured (.env.local)## Tech Stack



### Installation & Setup| Layer | Technology |

|---|---|

```bash| Framework | Next.js 14 (App Router) |

# 1. Install dependencies| Language | TypeScript 5.5 (strict) |

npm install| Styling | Tailwind CSS 3.4.10 |

| Auth | NextAuth v4 (JWT) |

# 2. Set up environment variables| ORM | Prisma 5.17 |

cp .env.example .env.local| Database | PostgreSQL |

# Edit .env.local with your database and API keys| Payments | Khalti ePayment API |

| File Uploads | UploadThing v7 |

# 3. Apply database migrations| Maps | Leaflet + react-leaflet |

npm run db:push| Password | bcrypt (12 rounds) |



# 4. Seed demo data---

npm run db:seed

## Quick Start

# 5. Start development server

npm run dev### 1. Clone and install

``````bash

git clone <your-repo>

The application will be available at `http://localhost:3000`cd nepalstay

npm install

---```



## 📊 Demo Credentials### 2. Environment variables

```bash

### Admin Panelcp .env.example .env

- **Email:** admin@nepalstay.com```

- **Password:** admin123

- **URL:** /adminFill in `.env`:

```env

### Vendor (Small Hotel)DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/nepalstay"

- **Email:** rajesh@urbanboutique.comNEXTAUTH_SECRET="run: openssl rand -base64 32"

- **Password:** password123NEXTAUTH_URL="http://localhost:3000"

- **Hotel:** Urban Kathmandu Boutique (8 rooms)UPLOADTHING_TOKEN="get from uploadthing.com dashboard"

- **URL:** /vendorKHALTI_SECRET_KEY="test_secret_key_xxxxx  (from Khalti merchant dashboard)"

```

### Vendor (Large Hotel)

- **Email:** sita@mountainlodge.com### 3. Database setup

- **Password:** password123```bash

- **Hotel:** Pokhara Mountain Lodge (32 rooms)npx prisma db push

- **URL:** /vendornpm run db:seed

```

### Customer

- **Email:** traveler@example.com### 4. Run development server

- **Password:** password123```bash

- **URL:** /customernpm run dev

```

### Staff

- **Email:** maya@mountainlodge.com (Large Hotel)Open [http://localhost:3000](http://localhost:3000)

- **Password:** password123

- **URL:** /staff---



---## Demo Credentials



## 🏗️ Architecture Highlights| Role | Email | Password |

|---|---|---|

### Key Features| Admin | admin@nepalstay.com | admin123 |

✅ **Nationality-Based User Profiles** — Set once at registration, never changes  | Vendor | vendor1@nepalstay.com | password123 |

✅ **Unique Room Numbers** — Every room has a unique ID (101, G05, 301, etc.)  | Vendor 2 | vendor2@nepalstay.com | password123 |

✅ **Unique Room Names** — No duplicate names per hotel  | Staff | staff@nepalstay.com | password123 |

✅ **Small & Large Hotel Support** — Small hotels don't need staff management  | Customer | customer@nepalstay.com | password123 |

✅ **Staff Auto-Enablement** — Staff features unlock at 12+ rooms  

✅ **Complete Data Isolation** — Vendors only see their own hotel  ---

✅ **FNMIS Compliance** — Foreign guest tracking for government compliance  

✅ **Payment Integration** — Khalti, Stripe, and Cash payment options  ## User Roles



### Tech Stack### Customer

- Search and filter hotels by city, type, stars, price

| Layer | Technology |- View hotel detail with image gallery, Leaflet map, reviews

|-------|------------|- Book rooms with BS (Bikram Sambat) or AD calendar

| **Frontend** | Next.js 14, React 18, Tailwind CSS |- Pay via Khalti digital wallet or cash on arrival

| **Backend** | Next.js API Routes, Node.js |- Manage bookings, cancel with automatic refund policy

| **Database** | PostgreSQL with Prisma ORM |- Write verified reviews (only after checkout)

| **Authentication** | NextAuth.js |- Save hotels to wishlist

| **State Management** | TanStack React Query |

| **Form Validation** | React Hook Form + Zod |### Vendor

| **File Upload** | UploadThing |- Create hotel listing (submitted for admin approval)

| **Payments** | Stripe + Khalti |- Manage rooms: add, edit, toggle active/inactive

- Confirm, check-in, check-out guests

---- View revenue dashboard with monthly growth

- Read guest reviews

## 📁 Project Structure

### Staff

```- View and update room status for assigned hotel

nepalstay/- Optimistic UI updates (instant, no wait for API)

├── app/                          # Next.js app directory- Today's check-in list filtered by current date

│   ├── (auth)/                   # Authentication pages- Check In / Check Out directly from arrivals table

│   ├── api/                      # API endpoints

│   ├── admin/                    # Admin dashboard### Admin

│   ├── vendor/                   # Vendor dashboard- Approve / reject / suspend hotel listings

│   ├── staff/                    # Staff dashboard- Manage all user accounts and roles

│   └── customer/                 # Customer dashboard- FNMIS compliance dashboard (24-hour foreign guest reporting)

├── components/                   # React components- IRD audit report for any date range (BS + AD dates)

├── lib/                          # Utilities & helpers- Review moderation (hide/show)

├── prisma/                       # Database schema & seed- Process manual refunds

└── public/                       # Static assets

```---



---## Key Features



## 🛏️ Hotels & Rooms### Bikram Sambat (BS) Calendar

- Full BS ↔ AD converter covering 2070–2095 BS

### Hotel 1: Urban Kathmandu Boutique (Small)- Custom NepaliDatePicker component

- **Location:** Kathmandu, Thamel- Toggle persisted to localStorage — survives page refresh

- **Rooms:** 8 (unique names & numbers)- All dates in FNMIS and audit reports show both BS and AD

- **Floors:** 2

- **Staff Enabled:** No (small hotel)### FNMIS Compliance

- **Features:** Rooftop garden, restaurant, parking- 24-hour reporting deadline auto-set for foreign guests

- Admin dashboard with PENDING / OVERDUE / REPORTED tabs

**Room Details:**- Hourly cron endpoint: `GET /api/cron/fnmis-check`

```- Set `CRON_SECRET` env var and call this hourly via uptime robot or Vercel cron

Floor 1:

  - 101: City View Single (1 bed, ₹3,500/night)### Khalti Payment

  - 102: City View Double (2 beds, ₹6,500/night)- Step-based flow: Initiate → Khalti tab → "I've Completed Payment" → Verify

  - 103: Twin Beds Superior (2 beds, ₹5,500/night)- `bookingId` embedded in `return_url` (works across tabs)

  - 104: Deluxe Family Room (3 beds, ₹8,500/night)- Idempotent verify — double-calls return existing invoice



Floor 2:### IRD-Compliant Invoices

  - 201: Mountain View Single (1 bed, ₹4,200/night)- Format: `INV-XXXXXXXX-NNNNNN`

  - 202: Himalayan View Deluxe (2 beds, ₹9,500/night)- Credit notes: `CN-INV-XXXXXXXX-NNNNNN`

  - 203: Romantic Suite (2 beds, ₹12,000/night)- Cancellation policy: >7 days = 100%, 3–7 days = 50%, <3 days = 0%

  - 204: Penthouse with Terrace (4 beds, ₹15,000/night)

```### Booking Conflict Prevention

- PostgreSQL SERIALIZABLE transaction

### Hotel 2: Pokhara Mountain Lodge (Large)- Conflict check + INSERT are atomic — race conditions impossible

- **Location:** Pokhara, Lakeside

- **Rooms:** 32 (unique names & numbers)### Content-Based Hotel Recommendations

- **Floors:** 4 (Basement + 3 levels)- Cosine similarity on feature vectors (star rating, price, city, type, amenities)

- **Staff Enabled:** Yes- Top-6 similar hotels shown on every hotel detail page

- **Features:** Lake view, restaurant, spa, conference room

---

**Room Distribution:**

```## Project Structure

Basement (Budget):

  - 8 economy rooms (dorms, singles, doubles)```

  nepalstay/

Floor 1 (Standard):├── app/

  - 8 standard rooms with lake views│   ├── (auth)/          # Login, Register

  │   ├── hotels/          # Public hotel search + detail

Floor 2 (Premium):│   ├── customer/        # Customer bookings, wishlist, profile

  - 8 premium suites and deluxe rooms│   ├── vendor/          # Vendor dashboard, hotel, rooms, bookings

  │   ├── staff/           # Staff operations panel

Floor 3 (Executive):│   ├── admin/           # Admin dashboard, hotels, users, FNMIS, audit

  - 8 penthouse and executive rooms│   ├── payment/         # Khalti return page

```│   └── api/             # All API routes (29 total)

├── components/

---│   ├── providers/       # SessionProvider, CalendarContext, ToastContext

│   ├── Navbar.tsx       # 4-role responsive navbar

## 🔐 User Roles & Permissions│   ├── BookingModal.tsx # Full booking flow with BS picker + Khalti

│   ├── HotelMap.tsx     # Leaflet map (dynamic import, no SSR)

### 1. Customer│   ├── NepaliDatePicker.tsx

- Browse and search hotels│   ├── BsDateDisplay.tsx

- Make bookings│   ├── KhaltiButton.tsx

- Pay via Khalti/Stripe/Cash│   └── AvatarUploader.tsx

- Write reviews├── lib/

- Manage wishlist│   ├── auth.ts          # NextAuth config

- Track loyalty points│   ├── prisma.ts        # Singleton client

│   ├── booking.ts       # Conflict detection, pricing, cancellation policy

### 2. Vendor│   ├── nepali-date.ts   # BS/AD converter

- Manage one hotel│   ├── recommendation.ts # Cosine similarity algorithm

- Set room prices│   └── uploadthing.ts

- View bookings└── prisma/

- Generate invoices    ├── schema.prisma    # 8 models, fully indexed

- View analytics    └── seed.ts          # 5 users, 3 Nepal hotels, 8 room types

- Upload hotel images```



**Note:** Vendor can see ONLY their hotel data---



### 3. Staff## Available Scripts

- Available only for hotels with 12+ rooms

- Manage room status (cleaning, maintenance)```bash

- Process check-ins/check-outsnpm run dev          # Start development server

- View guest infonpm run build        # Production build

- Can see only assigned hotelnpm run start        # Start production server

npm run lint         # ESLint check

### 4. Adminnpm run db:push      # Push schema to database

- Approve/reject hotel applicationsnpm run db:migrate   # Create migration

- Suspend problematic hotelsnpm run db:studio    # Open Prisma Studio

- View all bookings system-widenpm run db:seed      # Seed demo data

- View all users```

- Generate reports

- Full system access---



---## Seed Data



## 📱 FeaturesAfter `npm run db:seed`:



### Customer Features- **Himalayan Heritage Hotel** — Kathmandu, 4★ (lat: 27.7172, lng: 85.3240)

- Hotel search with filters (city, price, rating)- **Lakeside Serenity Resort** — Pokhara, 4★ Resort (lat: 28.2096, lng: 83.9856)

- Advanced availability calendar- **Chitwan Jungle Lodge** — Chitwan, 3★ Lodge (lat: 27.5799, lng: 84.4985)

- Room comparison

- Secure booking8 room types across these hotels with realistic NPR pricing.

- Multiple payment options

- Loyalty program---

- Review system

- Wishlist management## Production Deployment



### Vendor Features1. **Database**: Supabase (free tier) or Render PostgreSQL

- Hotel listing & management2. **App**: Vercel — connect GitHub repo, add env vars

- Room inventory3. **FNMIS cron**: Add to `vercel.json`:

- Booking management```json

- Revenue analytics{

- Guest management  "crons": [{

- PMS (Property Management System)    "path": "/api/cron/fnmis-check",

    "schedule": "0 * * * *"

### Staff Features  }]

- Room status management}

- Check-in/check-out process```

- Guest communication4. Add `CRON_SECRET` to env vars and Vercel cron header config

- Maintenance tracking

---

### Admin Features

- Hotel approval workflow*Built with ❤️ for Nepal's tourism sector*

- User management
- Booking audits
- Financial reports
- System analytics
- Compliance tracking

---

## 🌍 Foreign Tourist Features

Foreign nationals have special handling:

1. **At Signup:**
   - Select "Foreign Tourist" nationality
   - Provide passport number
   - Select purpose of visit

2. **Booking:**
   - Can book any available room
   - May have different pricing
   - Data tracked for FNMIS compliance

3. **After Checkout:**
   - Hotel staff reports to government
   - Automatic compliance tracking
   - 48-hour deadline for FNMIS report

---

## 💳 Payment Integration

### Supported Methods
- **Khalti** — Mobile payment (Nepal)
- **Stripe** — International credit/debit cards
- **Cash** — Pay at hotel

### Payment Flow
1. Customer adds items to cart
2. Selects payment method
3. Completes payment
4. Booking confirmed
5. Invoice generated

---

## 🔒 Security

### Authentication
- NextAuth.js with JWT
- Bcrypt password hashing (12 rounds)
- Session timeout: 24 hours
- CSRF protection

### Authorization
- Role-based access control (RBAC)
- Row-level security at API level
- Vendors can only access own hotel
- Staff can only access assigned hotel

### Data Validation
- Zod schema validation
- Input sanitization
- SQL injection prevention (Prisma ORM)
- XSS protection via React

---

## 🚀 Deployment

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://yourdomain.com

# Payment Gateways
KHALTI_SECRET_KEY=your-khalti-key
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_PUBLIC_KEY=your-stripe-public

# File Upload
UPLOADTHING_SECRET=your-uploadthing-secret

# Third-party APIs
SENTRY_DSN=optional-sentry-url
```

### Deploy to Vercel
```bash
npm i -g vercel
vercel
```

---

## 📖 Full Documentation

For detailed architecture and implementation guide, see [ARCHITECTURE.md](./ARCHITECTURE.md)

This comprehensive guide includes:
- Complete data model documentation
- All API endpoints
- User roles and permissions
- Security implementation
- Deployment checklist
- Troubleshooting guide

---

## 🐛 Common Issues

### Issue: Rooms not showing
- **Solution:** Ensure `npm run db:seed` was executed
- Check room `isActive` flag is `true`

### Issue: Vendor can see other hotels
- **Solution:** This is a security bug! Check vendor API uses `vendorId: session.user.id`

### Issue: Staff features not working
- **Solution:** Only enabled for hotels with 12+ rooms
- Check `hotel.staffEnabled` flag
- Verify `hotel.hotelSize` is MEDIUM or LARGE

### Issue: Foreign guest FNMIS not reporting
- **Solution:** Check `booking.fnmisOverdue` flag
- Verify staff has access to guest information

---

## 📊 Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint

# Database
npm run db:push          # Apply schema changes
npm run db:seed          # Seed demo data
npm run db:studio        # Open Prisma Studio

# Testing
npm run test             # Run Jest tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

---

## 📞 Support

- **Issue Tracker:** GitHub Issues
- **Documentation:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Email:** support@nepalstay.com

---

## 📄 License

This project is part of BSc CSIT curriculum at Tribhuvan University.

---

## 👨‍💻 Contributors

- **Developer:** [Your Name]
- **Institution:** Tribhuvan University, Bhairahawa Multiple Campus
- **Year:** 2026

---

**Last Updated:** May 18, 2026
