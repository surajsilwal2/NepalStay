# NepalStay — Online Hotel Booking Portal

**BSc CSIT 7th Semester Project**
Tribhuvan University · Bhairahawa Multiple Campus

A full-stack hotel booking marketplace built for Nepal's hospitality market.
Search, compare, and book hotels across Kathmandu, Pokhara, Chitwan, and beyond.

Live demo: [nepal-stay.vercel.app](https://nepal-stay.vercel.app)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.5 (strict) |
| Styling | Tailwind CSS 3.4.10 |
| Auth | NextAuth v4 (JWT) |
| ORM | Prisma 5.17 |
| Database | PostgreSQL |
| Payments | Khalti ePayment API |
| File Uploads | UploadThing v7 |
| Maps | Leaflet + react-leaflet |
| Password | bcrypt (12 rounds) |

---

## Quick Start

### 1. Clone and install
```bash
git clone <your-repo>
cd nepalstay
npm install
```

### 2. Environment variables
```bash
cp .env.example .env
```

Fill in `.env`:
```env
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/nepalstay"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
UPLOADTHING_TOKEN="get from uploadthing.com dashboard"
KHALTI_SECRET_KEY="test_secret_key_xxxxx  (from Khalti merchant dashboard)"
```

### 3. Database setup
```bash
npx prisma db push
npm run db:seed
```

### 4. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@nepalstay.com | admin123 |
| Vendor | vendor1@nepalstay.com | password123 |
| Vendor 2 | vendor2@nepalstay.com | password123 |
| Staff | staff@nepalstay.com | password123 |
| Customer | customer@nepalstay.com | password123 |

---

## User Roles

### Customer
- Search and filter hotels by city, type, stars, price
- View hotel detail with image gallery, Leaflet map, reviews
- Book rooms with BS (Bikram Sambat) or AD calendar
- Pay via Khalti digital wallet or cash on arrival
- Manage bookings, cancel with automatic refund policy
- Write verified reviews (only after checkout)
- Save hotels to wishlist

### Vendor
- Create hotel listing (submitted for admin approval)
- Manage rooms: add, edit, toggle active/inactive
- Confirm, check-in, check-out guests
- View revenue dashboard with monthly growth
- Read guest reviews

### Staff
- View and update room status for assigned hotel
- Optimistic UI updates (instant, no wait for API)
- Today's check-in list filtered by current date
- Check In / Check Out directly from arrivals table

### Admin
- Approve / reject / suspend hotel listings
- Manage all user accounts and roles
- FNMIS compliance dashboard (24-hour foreign guest reporting)
- IRD audit report for any date range (BS + AD dates)
- Review moderation (hide/show)
- Process manual refunds

---

## Key Features

### Bikram Sambat (BS) Calendar
- Full BS ↔ AD converter covering 2070–2095 BS
- Custom NepaliDatePicker component
- Toggle persisted to localStorage — survives page refresh
- All dates in FNMIS and audit reports show both BS and AD

### FNMIS Compliance
- 24-hour reporting deadline auto-set for foreign guests
- Admin dashboard with PENDING / OVERDUE / REPORTED tabs
- Hourly cron endpoint: `GET /api/cron/fnmis-check`
- Set `CRON_SECRET` env var and call this hourly via uptime robot or Vercel cron

### Khalti Payment
- Step-based flow: Initiate → Khalti tab → "I've Completed Payment" → Verify
- `bookingId` embedded in `return_url` (works across tabs)
- Idempotent verify — double-calls return existing invoice

### IRD-Compliant Invoices
- Format: `INV-XXXXXXXX-NNNNNN`
- Credit notes: `CN-INV-XXXXXXXX-NNNNNN`
- Cancellation policy: >7 days = 100%, 3–7 days = 50%, <3 days = 0%

### Booking Conflict Prevention
- PostgreSQL SERIALIZABLE transaction
- Conflict check + INSERT are atomic — race conditions impossible

### Content-Based Hotel Recommendations
- Cosine similarity on feature vectors (star rating, price, city, type, amenities)
- Top-6 similar hotels shown on every hotel detail page

---

## Project Structure

```
nepalstay/
├── app/
│   ├── (auth)/          # Login, Register
│   ├── hotels/          # Public hotel search + detail
│   ├── customer/        # Customer bookings, wishlist, profile
│   ├── vendor/          # Vendor dashboard, hotel, rooms, bookings
│   ├── staff/           # Staff operations panel
│   ├── admin/           # Admin dashboard, hotels, users, FNMIS, audit
│   ├── payment/         # Khalti return page
│   └── api/             # All API routes (29 total)
├── components/
│   ├── providers/       # SessionProvider, CalendarContext, ToastContext
│   ├── Navbar.tsx       # 4-role responsive navbar
│   ├── BookingModal.tsx # Full booking flow with BS picker + Khalti
│   ├── HotelMap.tsx     # Leaflet map (dynamic import, no SSR)
│   ├── NepaliDatePicker.tsx
│   ├── BsDateDisplay.tsx
│   ├── KhaltiButton.tsx
│   └── AvatarUploader.tsx
├── lib/
│   ├── auth.ts          # NextAuth config
│   ├── prisma.ts        # Singleton client
│   ├── booking.ts       # Conflict detection, pricing, cancellation policy
│   ├── nepali-date.ts   # BS/AD converter
│   ├── recommendation.ts # Cosine similarity algorithm
│   └── uploadthing.ts
└── prisma/
    ├── schema.prisma    # 8 models, fully indexed
    └── seed.ts          # 5 users, 3 Nepal hotels, 8 room types
```

---

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
npm run db:push      # Push schema to database
npm run db:migrate   # Create migration
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed demo data
```

---

## Seed Data

After `npm run db:seed`:

- **Himalayan Heritage Hotel** — Kathmandu, 4★ (lat: 27.7172, lng: 85.3240)
- **Lakeside Serenity Resort** — Pokhara, 4★ Resort (lat: 28.2096, lng: 83.9856)
- **Chitwan Jungle Lodge** — Chitwan, 3★ Lodge (lat: 27.5799, lng: 84.4985)

8 room types across these hotels with realistic NPR pricing.

---

## Production Deployment

1. **Database**: Supabase (free tier) or Render PostgreSQL
2. **App**: Vercel — connect GitHub repo, add env vars
3. **FNMIS cron**: Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/fnmis-check",
    "schedule": "0 * * * *"
  }]
}
```
4. Add `CRON_SECRET` to env vars and Vercel cron header config

---

*Built with ❤️ for Nepal's tourism sector*
