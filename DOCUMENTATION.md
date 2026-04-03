# NepalStay Documentation

## Quick Start

- **README.md** - Project overview and setup instructions
- **QUICK_START.md** - Quick reference for common tasks
- **QUICK_REFERENCE.md** - API and feature reference

## Setup

- **SETUP_AND_TESTING.md** - Development environment setup and testing guide

## Archived Documentation

For detailed historical documentation about implementation phases and architectural decisions, see the `.docs-archive/` folder which contains:

- Implementation guides and checklists
- Phase-specific documentation (Phases 1-5)
- Architecture diagrams and analysis
- Optimization notes
- Delivery and completion summaries

## Project Structure

```
nepalstay/
├── app/                          # Next.js app directory
│   ├── (auth)/                   # Authentication pages (login, register)
│   ├── admin/                    # Admin dashboard
│   ├── customer/                 # Customer features
│   ├── staff/                    # Staff operations panel
│   ├── vendor/                   # Vendor dashboard
│   ├── hotels/                   # Hotel browsing and details
│   ├── itinerary/                # Travel itinerary planner
│   ├── stats/                    # Public statistics
│   ├── payment/                  # Payment processing
│   ├── api/                      # API routes
│   └── ...
├── components/                   # Reusable React components
├── lib/                          # Utilities and helpers
├── prisma/                       # Database schema
└── public/                       # Static assets
```

## Key Features

### Authentication & Authorization
- NextAuth.js with role-based access (CUSTOMER, VENDOR, STAFF, ADMIN)
- Multiple authentication strategies
- Session management

### Hotel Management
- Browse and filter hotels
- Detailed hotel pages with reviews and amenities
- Hotel availability and booking system
- Vendor analytics and PMS integration

### Customer Features
- Hotel search and filtering
- Booking management
- Wishlist functionality
- Profile management
- Loyalty points system
- Itinerary planner

### Admin Features
- Hotel approval and management
- User and booking oversight
- Audit reporting with Groq AI insights
- Revenue tracking
- FNMIS registration

### Staff Features
- Room status management
- Check-in/check-out operations
- Today's bookings view
- Restricted to assigned hotel

### Vendor Features
- Hotel information management
- Room management
- Booking management
- Analytics and revenue tracking
- PMS integration
- Review management

## Technology Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Node.js, Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js
- **Payments**: Stripe, Khalti
- **AI**: Groq API for report generation
- **Notifications**: SMS via Trigger.dev
- **Date Handling**: Nepali calendar (Bikram Sambat) support

## API Routes

### Authentication
- `POST /api/auth/*` - NextAuth endpoints

### Hotels
- `GET /api/hotels` - List hotels
- `GET /api/hotels/[slug]` - Hotel details
- `POST /api/hotels` - Create hotel (vendor)

### Bookings
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `PATCH /api/bookings/[id]` - Update booking

### Admin
- `GET /api/admin/audit` - Audit report with AI summary
- `GET /api/admin/stats` - Admin statistics

### Staff
- `GET /api/staff/rooms` - Staff's hotel rooms only
- `PATCH /api/staff/rooms/[id]/status` - Update room status

## Recent Improvements

### Issue Fixes (Latest)
1. **Profile Updates** - Name now updates in navbar when profile is changed
2. **Weather Widget** - Fixed positioning to stay behind contact card
3. **Staff Access** - Restricted staff to their assigned hotel only
4. **Public Stats** - Removed revenue from public statistics display
5. **Navbar Alignment** - Fixed vertical alignment of user name and role
6. **Report Generation** - Implemented Groq AI for audit report summaries
7. **Documentation** - Archived old docs to reduce clutter

## Environment Variables

See `.env` for configuration. Key variables:
- `DATABASE_URL` - PostgreSQL connection
- `NEXTAUTH_SECRET` - Session encryption
- `GROQ_API_KEY` - AI report generation
- `STRIPE_SECRET_KEY` - Payment processing
- `KHALTI_SECRET_KEY` - Local payments
- `UPLOADTHING_TOKEN` - File uploads

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run linting
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database
```

## Support & Contributing

For issues or contributions, please refer to the main README.md file.
