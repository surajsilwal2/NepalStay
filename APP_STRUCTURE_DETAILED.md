# NepalStay Application Structure - Detailed Exploration

## Overview
NepalStay is a comprehensive hotel booking platform for Nepal with advanced features including FNMIS compliance, dynamic pricing, loyalty programs, payment integration (Khalti & Stripe), offline support, and multi-role management (Admin, Vendor, Staff, Customer).

---

## ROOT-LEVEL FILES

### 1. **app/page.tsx** (Root Home Page)
- **Path:** `/` (root)
- **Purpose:** Entry point for the application. Handles role-based redirects.
- **Routes Created:** `/`
- **Key Logic:**
  - Checks user session with NextAuth
  - Redirects based on role:
    - `ADMIN` → `/admin`
    - `VENDOR` → `/vendor`
    - `STAFF` → `/staff`
    - Default/`CUSTOMER` → `/hotels`
  - Unauthenticated users → `/hotels`
- **Exports:** Default async component
- **User Roles:** All (redirects based on role)
- **Dependencies:** NextAuth (`getServerSession`)

### 2. **app/layout.tsx** (Root Layout)
- **Path:** Root layout wrapper
- **Purpose:** Global HTML structure, metadata, providers setup
- **Key Features:**
  - Metadata with OpenGraph for social sharing
  - Viewport configuration (theme color: #f59e0b amber)
  - Providers wrapped:
    - `SessionProvider` - NextAuth session
    - `QueryClientProvider` - TanStack Query
    - `CalendarProvider` - BS/AD calendar context
    - `ToastProvider` - Toast notifications
    - `CompareProvider` - Hotel comparison feature
  - Dynamic imports (SSR disabled):
    - `CompareBar` - Floating comparison bar
    - `ServiceWorkerRegister` - PWA service worker
    - `ChatWidget` - Live chat support
  - Preconnect to UploadThing CDN (utfs.io)
  - Manifest link for PWA
- **UI Elements:**
  - Responsive layout with Tailwind CSS (Inter font)
  - Service worker registration for offline support
  - Chat widget floating component
- **User Roles:** All (global layout)

### 3. **app/globals.css** (Global Styles)
- **Purpose:** Tailwind CSS setup + custom utilities
- **Content:**
  - Tailwind directives (@tailwind base, components, utilities)
  - Custom utilities:
    - `.line-clamp-2` / `.line-clamp-3` - Text truncation
    - `.toast-enter` - Toast slide-in animation
  - Leaflet map icon path fix for Next.js
- **User Roles:** All

### 4. **app/error.tsx** (Global Error Boundary)
- **Path:** Error boundary for unhandled errors
- **Purpose:** Catch and display errors gracefully
- **Key Features:**
  - "Use client" component
  - Displays error message with icon (AlertTriangle)
  - Buttons: "Try Again" (reset) and "Browse Hotels"
  - Logs error to console
- **UI Elements:** Rounded card, red alert styling, action buttons
- **User Roles:** All

### 5. **app/loading.tsx** (Global Loading State)
- **Path:** Fallback during page transitions
- **Purpose:** Show loading spinner during data fetching
- **UI Elements:** Spinning loader with "Loading NepalStay…" text
- **User Roles:** All

### 6. **app/not-found.tsx** (404 Page)
- **Path:** `/404` or nonexistent routes
- **Purpose:** Handle page not found
- **Key Elements:**
  - MapPin icon
  - "404" heading with "Page not found" message
  - Buttons: "Browse Hotels" and "Go Home"
- **UI Elements:** Centered layout with icon and action buttons
- **User Roles:** All

### 7. **app/offline/page.tsx** (Offline Page)
- **Path:** `/offline`
- **Purpose:** Shown when user loses internet connection
- **Key Features:**
  - "Use client" component
  - Displays cached booking data
  - Links to cached customer bookings
  - "Try Again" button to retry connection
  - Nepal mountain emoji (🏔️)
- **UI Elements:** Dark theme (slate-900), informational text
- **Routes Created:** `/offline`
- **User Roles:** All (especially useful for trekking areas)

### 8. **app/unauthorized/page.tsx** (Unauthorized Page)
- **Path:** `/unauthorized`
- **Purpose:** Access denied page for insufficient permissions
- **Key Elements:**
  - ShieldX icon (red)
  - "Access Denied" heading
  - "Browse Hotels" button
- **UI Elements:** Error styling with shield icon
- **Routes Created:** `/unauthorized`
- **User Roles:** Authenticated users without required permissions

---

## AUTHENTICATION SECTION: app/(auth)/

### 1. **app/(auth)/login/page.tsx** (Login Page)
- **Path:** `/login`
- **Purpose:** User authentication
- **Key Features:**
  - "Use client" component with form validation
  - React Hook Form + Zod schema validation
  - Email and password fields
  - Show/hide password toggle (Eye icon)
  - Error message display
  - Demo credentials section showing test accounts:
    - Admin: admin@nepalstay.com / admin123
    - Vendor: vendor1@nepalstay.com / password123
    - Staff: staff@nepalstay.com / password123
    - Customer: customer@nepalstay.com / password123
  - Loading state with spinner
- **Routes Created:** `/login`
- **API Calls:** `signIn()` from NextAuth (credentials provider)
- **Form Fields:**
  - Email (required, valid email)
  - Password (required)
- **Exports:** Default client component
- **User Roles:** Public (unauthenticated)
- **UI Elements:**
  - Gradient background (slate-900 to amber-900)
  - NepalStay branding with Hotel icon
  - White card with form
  - Error styling in red
  - Link to register page

### 2. **app/(auth)/register/page.tsx** (Registration Page)
- **Path:** `/register`
- **Purpose:** Create new user account (Customer or Vendor)
- **Key Features:**
  - "Use client" component
  - React Hook Form + Zod validation
  - Role selection: CUSTOMER or VENDOR
  - Success state with redirect to login
  - Password confirmation validation
  - Loading state during submission
  - Success animation with CheckCircle icon
- **Routes Created:** `/register`
- **API Calls:** `POST /api/auth/register`
- **Form Fields:**
  - Full Name (min 2 characters)
  - Email (valid email)
  - Phone (optional)
  - Password (min 8 characters)
  - Confirm Password (must match)
  - Role (CUSTOMER or VENDOR) - default CUSTOMER
- **Exports:** Default client component
- **User Roles:** Public (unauthenticated)
- **UI Elements:**
  - Role selector with icons (🏨 for traveller, 🏢 for hotel owner)
  - Form fields with validation error messages
  - Password visibility toggle
  - Link to login page
  - Success message with 3-second redirect

---

## ADMIN SECTION: app/admin/

### 1. **app/admin/page.tsx** (Admin Dashboard)
- **Path:** `/admin`
- **Purpose:** Admin overview dashboard with key metrics
- **Key Features:**
  - "Use client" component
  - Fetches dashboard stats from `/api/admin/stats`
  - Alert banners for actionable items:
    - Pending hotel approvals
    - Pending refunds requiring manual processing
    - Overdue FNMIS reports
  - Stats cards showing:
    - Revenue this month (with growth percentage)
    - Total bookings (with pending count)
    - Total hotels (with approved count)
    - Registered users count
  - Room status breakdown (AVAILABLE, OCCUPIED, CLEANING, MAINTENANCE)
  - Quick access navigation to:
    - Hotel Approvals
    - All Bookings
    - User Management
    - FNMIS Reports
    - Review Moderation
    - Audit Report
- **Routes Created:** `/admin`
- **API Calls:** `GET /api/admin/stats`
- **User Roles:** ADMIN only
- **UI Elements:**
  - Skeleton loading state
  - Color-coded stat cards (green, blue, purple, amber)
  - Alert banners with action links
  - Room status grid with color indicators
  - Quick nav card with links and icons

### 2. **app/admin/hotels/page.tsx** (Hotel Management)
- **Path:** `/admin/hotels`
- **Purpose:** Review and approve/reject hotel listings
- **Key Features:**
  - Filter by status: ALL, PENDING, APPROVED, REJECTED
  - Show hotel count per status
  - Hotel cards displaying:
    - Hotel image, name, star rating
    - City and address
    - Property type
    - Amenities
    - Vendor info (name, email, phone)
    - Room and booking counts
  - Actions per hotel:
    - APPROVE - Set status to APPROVED
    - REJECT - Set status to REJECTED with optional reason
    - SUSPEND - Suspend listing
  - Refresh button to reload data
  - Loading skeleton UI
- **Routes Created:** `/admin/hotels`
- **API Calls:**
  - `GET /api/admin/hotels` (with optional ?status filter)
  - `PATCH /api/admin/hotels/{id}` (approve/reject/suspend)
- **User Roles:** ADMIN only
- **UI Elements:**
  - Filter tabs with count badges
  - Hotel cards with images
  - Status badges (yellow/green/red/orange)
  - Action buttons (Approve, Reject, Suspend)
  - Refresh button with icon

### 3. **app/admin/users/page.tsx** (User Management)
- **Path:** `/admin/users`
- **Purpose:** Manage user accounts and roles
- **Key Features:**
  - User table showing:
    - Name, Email, Role, Bookings count, Joined date, Active status
  - Filter by role: ALL, CUSTOMER, VENDOR, STAFF, ADMIN
  - Role counts in stat cards
  - Actions per user:
    - Disable/Enable account (toggle isActive)
    - Change role
  - Refresh button
  - Loading skeleton for each row
- **Routes Created:** `/admin/users`
- **API Calls:**
  - `GET /api/admin/users` (with optional ?role filter)
  - `PATCH /api/admin/users/{id}` (update role or isActive)
- **User Roles:** ADMIN only
- **UI Elements:**
  - User stat cards (ALL, CUSTOMER, VENDOR, STAFF, ADMIN)
  - Data table with sorting
  - Role badges (color-coded)
  - Toggle buttons for account status
  - Refresh button

### 4. **app/admin/bookings/page.tsx** (Booking Management)
- **Path:** `/admin/bookings`
- **Purpose:** View and manage all bookings, process refunds, issue invoices
- **Key Features:**
  - Filter by booking status: ALL, PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT
  - Booking details:
    - Status, Check-in/out dates, Nights, Total price
    - Payment status, Invoice number, Paid date
    - Guest info (name, email)
    - Hotel and room details
    - Refund status (PENDING, COMPLETED, NOT_ELIGIBLE)
  - Actions per booking:
    - Update status (PENDING → CONFIRMED → CHECKED_IN → CHECKED_OUT)
    - Issue invoice (for cash payments)
    - Process refund (manual refund handling)
  - FNMIS compliance tracking (reported, auto-reported)
  - Passport info for foreign guests
- **Routes Created:** `/admin/bookings`
- **API Calls:**
  - `GET /api/bookings` (with optional ?status and ?limit)
  - `PATCH /api/bookings/{id}` (update status)
  - `POST /api/admin/invoice` (issue invoice)
  - `PATCH /api/admin/refunds` (process refund)
- **User Roles:** ADMIN only
- **UI Elements:**
  - Status filter tabs
  - Booking table with multiple columns
  - Status badges (colored by status)
  - Refund status badges
  - Action buttons (Status change, Invoice, Refund)

### 5. **app/admin/fnmis/page.tsx** (FNMIS Compliance)
- **Path:** `/admin/fnmis`
- **Purpose:** Track foreign national bookings for mandatory 24-hour reporting
- **Key Features:**
  - Summary cards:
    - Total foreign guests
    - Unreported bookings
    - Overdue (>24 hours)
    - Reported
  - Filter by: ALL, PENDING, OVERDUE, REPORTED
  - Booking details:
    - Guest nationality, passport number
    - Purpose of visit
    - Check-in date
    - Hours left before deadline
    - FNMIS deadline and reporting status
  - Action per booking:
    - Report to FNMIS (button to submit)
  - Auto-reporting capability
- **Routes Created:** `/admin/fnmis`
- **API Calls:**
  - `GET /api/fnmis` (get all foreign guest bookings)
  - `POST /api/fnmis` (report single booking)
- **User Roles:** ADMIN only (Nepal government compliance)
- **UI Elements:**
  - Summary stat cards (color-coded by status)
  - Filter tabs
  - Booking list with FNMIS deadline info
  - Report buttons with loading state

### 6. **app/admin/reviews/page.tsx** (Review Moderation)
- **Path:** `/admin/reviews`
- **Purpose:** Moderate and manage guest reviews
- **Key Features:**
  - Filter by: ALL, VISIBLE, HIDDEN
  - Review counts in filter buttons
  - Review cards showing:
    - Star rating (visual stars)
    - Title and body
    - Author name
    - Hotel name and city
    - Submission date
  - Actions per review:
    - Toggle visibility (Show/Hide)
  - Refresh button
- **Routes Created:** `/admin/reviews`
- **API Calls:**
  - `GET /api/admin/reviews` (with optional ?visible filter)
  - `PATCH /api/admin/reviews` (update isVisible)
- **User Roles:** ADMIN only
- **UI Elements:**
  - Filter tabs with count
  - Review cards with text truncation
  - Star display (filled/empty)
  - Visibility toggle buttons (Eye/EyeOff icons)
  - Metadata (author, hotel, date)

### 7. **app/admin/audit/page.tsx** (Audit Report)
- **Path:** `/admin/audit`
- **Purpose:** Generate IRD-compliant financial reports
- **Key Features:**
  - Date range picker (from/to)
  - Generate report button
  - Print button
  - Report details:
    - Period (AD and BS dates)
    - Fiscal year
    - Gross revenue
    - Total refunds
    - Net revenue
    - Invoice count
    - Refund count
    - AI summary of financial data
  - Invoice and credit note tables (detailed records)
- **Routes Created:** `/admin/audit`
- **API Calls:** `GET /api/admin/audit?from={date}&to={date}`
- **User Roles:** ADMIN only
- **Print Support:** Yes (print-optimized styling)
- **UI Elements:**
  - Date input fields
  - Print button
  - Summary cards (revenue, refunds)
  - Invoice/credit note tables
  - Fiscal year display

---

## VENDOR SECTION: app/vendor/

### 1. **app/vendor/page.tsx** (Vendor Dashboard)
- **Path:** `/vendor`
- **Purpose:** Vendor overview with hotel stats and booking info
- **Key Features:**
  - Checks if vendor has hotel listing
  - If no hotel: Shows "Create Hotel Listing" prompt
  - If hotel exists:
    - Hotel status (PENDING, APPROVED, REJECTED, SUSPENDED)
    - Total bookings count
    - Pending bookings count
    - Active guests count
    - Revenue this month
    - Revenue last month with growth %
    - Total reviews count
    - Room availability breakdown
    - Overbooking alert component
  - Quick nav buttons to:
    - Hotel settings
    - Rooms management
    - Bookings
    - Analytics
    - Reviews
    - PMS integration
  - New booking alerts
- **Routes Created:** `/vendor`
- **API Calls:** `GET /api/vendor/stats`
- **User Roles:** VENDOR only
- **UI Elements:**
  - Stat cards with color-coded icons
  - Trend indicators (growing/declining revenue)
  - Overbooking alert banner
  - Quick access cards with navigation
  - Empty state with create hotel button

### 2. **app/vendor/hotel/page.tsx** (Hotel Listing Management)
- **Path:** `/vendor/hotel`
- **Purpose:** Create or edit hotel listing
- **Key Features:**
  - Check hotel status with informational banner:
    - PENDING: "Under review by admin team"
    - APPROVED: "Live and accepting bookings"
    - REJECTED: "Please update and resubmit" + rejection reason
    - SUSPENDED: "Contact admin for details"
  - Form fields:
    - Name, Description, City, Address
    - Latitude/Longitude (optional)
    - Star rating (1-5)
    - Property type (Hotel, Guesthouse, Resort, Hostel, Lodge, Boutique)
    - Contact phone, email, website
    - Check-in/Check-out times
    - Cancellation policy
    - Amenities checkboxes (WiFi, Parking, Restaurant, Pool, etc.)
    - Hotel images upload (UploadThing)
  - Image management (add/remove)
  - Submit button (Create/Update)
- **Routes Created:** `/vendor/hotel`
- **API Calls:**
  - `GET /api/vendor/hotel` (get existing hotel)
  - `POST /api/vendor/hotel` (create new)
  - `PUT /api/vendor/hotel` (update existing)
- **User Roles:** VENDOR only
- **UI Elements:**
  - Status banner (color-coded based on status)
  - Form with text inputs, dropdowns, checkboxes
  - Image uploader with preview
  - Amenities selection grid
  - Submit button with loading state
  - Zod validation with error messages

### 3. **app/vendor/rooms/page.tsx** (Room Management)
- **Path:** `/vendor/rooms`
- **Purpose:** Create and manage hotel rooms
- **Key Features:**
  - Room grid displaying:
    - Room name, type badge (colored)
    - Price per night
    - Capacity, floor number
    - Total rooms in category
    - Booking count
  - Add room button opens modal
  - Edit room modal with all fields
  - Delete room with confirmation
  - Room types: SINGLE, DOUBLE, TWIN, DELUXE, SUITE, PENTHOUSE, DORMITORY
  - Form fields:
    - Name, Type, Price per night, Capacity
    - Floor number, Total rooms
    - Description (optional)
    - Amenities (comma-separated)
- **Routes Created:** `/vendor/rooms`
- **API Calls:**
  - `GET /api/vendor/rooms` (list all rooms)
  - `POST /api/vendor/rooms` (create room)
  - `PUT /api/vendor/rooms/{id}` (update room)
  - `DELETE /api/vendor/rooms/{id}` (delete room)
- **User Roles:** VENDOR only
- **UI Elements:**
  - Modal form for create/edit
  - Room cards grid
  - Type badges with unique colors per room type
  - Edit/Delete buttons per room
  - Confirmation dialog for deletion
  - Loading skeleton for initial load

### 4. **app/vendor/analytics/page.tsx** (Analytics Dashboard)
- **Path:** `/vendor/analytics`
- **Purpose:** Detailed performance analytics for hotel
- **Key Features:**
  - KPI metrics:
    - Total revenue, revenue by month (with growth %)
    - Occupancy rate, average booking value
    - Guests (Nepali vs Foreign breakdown)
    - Review count and overall rating
  - Charts:
    - Revenue by month (line chart)
    - Bookings by day (line chart)
    - Room performance (bar chart)
    - Guest nationality breakdown (pie chart)
    - Payment methods distribution (pie chart)
    - Peak booking days (bar chart)
  - Period selector
  - Interactive Recharts visualizations
- **Routes Created:** `/vendor/analytics`
- **API Calls:** `GET /api/vendor/analytics`
- **User Roles:** VENDOR only
- **UI Elements:**
  - KPI stat cards with trend indicators
  - Multiple chart types (line, bar, pie)
  - Color-coded charts
  - Responsive grid layout
  - Loading skeleton

### 5. **app/vendor/bookings/page.tsx** (Vendor Bookings)
- **Path:** `/vendor/bookings`
- **Purpose:** View and manage bookings for vendor's hotel
- **Key Features:**
  - Booking table with:
    - Status, Check-in/out dates, Nights, Total price
    - Guest info (name, email, phone)
    - Room details
    - Invoice number
    - Payment status
  - Filter by status: ALL, PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT
  - Actions per booking:
    - Update booking status
    - View details
  - Refresh button
  - Status counts in filter buttons
- **Routes Created:** `/vendor/bookings`
- **API Calls:**
  - `GET /api/bookings?limit=100` (with optional ?status filter)
  - `PATCH /api/bookings/{id}` (update status)
- **User Roles:** VENDOR only
- **UI Elements:**
  - Status filter tabs
  - Booking table with multiple columns
  - Status badges
  - Action buttons
  - Skeleton loading

### 6. **app/vendor/reviews/page.tsx** (Vendor Reviews)
- **Path:** `/vendor/reviews`
- **Purpose:** View guest reviews for vendor's hotel
- **Key Features:**
  - Overall hotel rating (out of 5)
  - Average scores for:
    - Cleanliness
    - Staff quality
    - Location
    - Value for money
    - Facilities
  - Individual reviews showing:
    - Star rating
    - Title and body text
    - Author name
    - Submission date
    - Category scores (cleanliness, staff, etc.)
  - Review visibility status (shown/hidden by admin)
- **Routes Created:** `/vendor/reviews`
- **API Calls:** `GET /api/vendor/hotel` (reviews included in response)
- **User Roles:** VENDOR only
- **UI Elements:**
  - Review summary card with rating display
  - Score breakdown chart/bars
  - Individual review cards
  - Star displays
  - Avatar for reviewer

### 7. **app/vendor/pms/page.tsx** (Property Management System)
- **Path:** `/vendor/pms`
- **Purpose:** Staff room management interface (similar to `/staff/page.tsx`)
- **Note:** Directory exists but specific implementation may vary
- **Likely Features:** Room status updates, check-in/check-out management

---

## STAFF SECTION: app/staff/

### 1. **app/staff/page.tsx** (Staff Panel)
- **Path:** `/staff`
- **Purpose:** On-property staff management (housekeeping, front desk)
- **Key Features:**
  - Two main tabs: ROOMS and CHECK-INS
  - Room Management:
    - Room list with current status
    - Status options: AVAILABLE, OCCUPIED, CLEANING, MAINTENANCE
    - Room details (name, floor, type, price)
    - Quick status buttons for each room
    - Visual status indicators (color dots)
  - Check-in Management:
    - Confirmed bookings list
    - Guest arrival info
    - Check-in/Check-out buttons
    - Guest details (name, email, booking dates)
    - Room assignment display
  - Optimistic UI updates (local state before server sync)
  - Error handling with toast notifications
- **Routes Created:** `/staff`
- **API Calls:**
  - `GET /api/staff/rooms` (list rooms)
  - `GET /api/bookings?status=CONFIRMED&limit=50` (pending check-ins)
  - `PATCH /api/staff/rooms/{id}/status` (update room status)
  - `PATCH /api/bookings/{id}` (update booking status)
- **User Roles:** STAFF only
- **UI Elements:**
  - Tab navigation (Rooms/Check-ins)
  - Room status buttons (color-coded)
  - Booking cards with guest info
  - Quick action buttons
  - Skeleton loading for initial data
  - Toast success/error notifications

### 2. **app/staff/pms/** (Property Management System)
- **Path:** `/staff/pms`
- **Purpose:** Advanced PMS features for staff
- **Status:** Directory exists, specific implementation details would require file reading

---

## CUSTOMER SECTION: app/customer/

### 1. **app/customer/bookings/page.tsx** (My Bookings)
- **Path:** `/customer/bookings`
- **Purpose:** View and manage customer's bookings
- **Key Features:**
  - Booking cards/list showing:
    - Hotel name, image, city
    - Room type and floor
    - Check-in/Check-out dates
    - Nights count
    - Total price
    - Booking status (PENDING, CONFIRMED, CHECKED_IN, CHECKED_OUT, CANCELLED, NO_SHOW)
    - Payment status
    - Invoice number (if paid)
  - Expandable details per booking:
    - Full booking information
    - Refund status and percentage
    - Guest count (adults/children)
    - Special notes
  - Actions per booking:
    - Write review (after checkout)
    - Cancel booking (with confirmation)
    - Request refund (if eligible)
    - Download invoice (if paid)
  - Empty state with browse hotels link
- **Routes Created:** `/customer/bookings`
- **API Calls:**
  - `GET /api/bookings?limit=50` (get customer's bookings)
  - `PATCH /api/bookings/{id}` (update booking status)
  - `POST /api/bookings/{id}/refund` (request refund)
- **User Roles:** CUSTOMER only
- **UI Elements:**
  - Booking cards with image
  - Status badges (colored by status)
  - Expandable details
  - Action buttons (Cancel, Refund, Review)
  - Confirmation dialog for cancellation
  - Skeleton loading

### 2. **app/customer/profile/page.tsx** (User Profile)
- **Path:** `/customer/profile`
- **Purpose:** Manage user profile information
- **Key Features:**
  - Avatar uploader with name display
  - User email display
  - Role badge (CUSTOMER, VENDOR, STAFF, ADMIN)
  - Editable fields:
    - Full name
    - Phone number
    - Address
  - Form validation with Zod
  - Loyalty card display (component)
  - Quick links:
    - My Bookings
    - Saved Hotels
    - Account Settings
  - Password change section (if applicable)
  - Logout button
- **Routes Created:** `/customer/profile`
- **API Calls:**
  - `PATCH /api/user/profile` (update profile)
  - Session update with NextAuth
- **User Roles:** All authenticated users (defaults to CUSTOMER context)
- **UI Elements:**
  - Avatar uploader component
  - Form inputs with validation
  - User info cards
  - Loyalty card component
  - Navigation buttons
  - Loading spinner during submission

### 3. **app/customer/wishlist/page.tsx** (Saved Hotels)
- **Path:** `/customer/wishlist`
- **Purpose:** View and manage wishlist of saved hotels
- **Key Features:**
  - Grid of wishlist items showing:
    - Hotel image
    - Star rating (visual stars)
    - Hotel name
    - City
    - Average review with count
    - Minimum price per night
  - Actions per item:
    - Remove from wishlist (heart button)
    - View hotel details (link)
  - Empty state with browse hotels link
  - Item count display
- **Routes Created:** `/customer/wishlist`
- **API Calls:**
  - `GET /api/wishlist` (get all wishlisted hotels)
  - `POST /api/wishlist` (add/remove from wishlist)
- **User Roles:** CUSTOMER only
- **UI Elements:**
  - Hotel cards grid (responsive)
  - Hotel image with star rating overlay
  - Remove button (heart icon)
  - Hotel info (name, city, price, rating)
  - View button linking to hotel details
  - Empty state message

---

## HOTELS SECTION: app/hotels/

### 1. **app/hotels/page.tsx** (Hotel Listing)
- **Path:** `/hotels`
- **Purpose:** Browse and search available hotels
- **Key Features:**
  - Uses `HotelsClient` component for full interactivity
  - Search and filter capabilities:
    - City filter dropdown
    - Price range (min/max)
    - Star rating (1-5)
    - Property type
    - Amenities multiselect
    - Search query (name/description/address)
  - Hotel grid displaying:
    - Hotel image
    - Name and city
    - Star rating
    - Average review score
    - Amenities tags
    - Minimum price per night
    - Compare button (for compare feature)
    - Wishlist button (heart icon)
  - Pagination
  - Sort options
  - Hotel count display
- **Routes Created:** `/hotels`
- **API Calls:** `GET /api/hotels?city={city}&stars={stars}&type={type}&amenities={amenities}&q={query}&minPrice={min}&maxPrice={max}&page={page}&limit={limit}`
- **User Roles:** All (public)
- **UI Elements:**
  - Filter sidebar
  - Hotel grid
  - Compare bar (sticky)
  - Wishlist buttons
  - Pagination controls
  - Sorting options

### 2. **app/hotels/[slug]/page.tsx** (Hotel Detail)
- **Path:** `/hotels/{slug}`
- **Purpose:** View detailed hotel information and book
- **Key Features:**
  - Hotel information:
    - Gallery with multiple images
    - Hotel name, star rating, property type
    - City and address
    - Description
    - Amenities list (with icons)
    - Contact info (phone, email, website)
  - Guest reviews section:
    - Overall rating (visual stars)
    - Category ratings (cleanliness, staff, location, value, facilities)
    - Individual review cards with scores
  - Room offerings:
    - Room type, capacity, floor
    - Price per night
    - Amenities per room
    - Availability status
  - Dynamic pricing display
  - Weather widget (location-based)
  - Carbon footprint estimate
  - Season badge (peak/off-season)
  - Availability calendar (BS date support)
  - Hotel location map (HotelMap component with Leaflet)
  - Similar hotel recommendations
  - Booking modal (triggered by "Book Now")
- **Routes Created:** `/hotels/{slug}`
- **API Calls:**
  - `GET /api/hotels/{slug}` (get hotel details)
  - `POST /api/wishlist` (add/remove wishlist)
  - Booking submission
- **User Roles:** All (public)
- **UI Elements:**
  - Image gallery with carousel
  - Star rating display
  - Amenity icons/badges
  - Review cards with individual scores
  - Room cards with CTA buttons
  - Weather widget
  - Season badge
  - Availability calendar (BS/AD dates)
  - Interactive map
  - Booking modal

### 3. **app/hotels/HotelsClient.tsx** (Client Hotels Component)
- **Path:** Used by `/hotels/page.tsx`
- **Purpose:** Client-side hotel search and filtering logic
- **Key Features:**
  - Search form with filters
  - Hotel grid rendering
  - Pagination and sorting
  - Filter state management
  - Dynamic hotel loading
- **Note:** Component-specific implementation details in file

---

## PAYMENT SECTION: app/payment/

### 1. **app/payment/success/page.tsx** (Payment Verification)
- **Path:** `/payment/success`
- **Purpose:** Verify and confirm payment after Khalti callback
- **Key Features:**
  - Extracts payment details from URL (pidx, bookingId)
  - Three states: loading, success, error
  - On success:
    - Shows CheckCircle icon
    - Displays invoice number
    - Shows success message
    - Link to view bookings
  - On error:
    - Shows XCircle icon
    - Displays error message
    - Link to check booking status
  - Verifies payment with backend
  - Removes stored session data (khalti_pidx, khalti_bookingId)
- **Routes Created:** `/payment/success`
- **API Calls:** `POST /api/payment/khalti/verify` (with pidx and bookingId)
- **User Roles:** CUSTOMER (during checkout)
- **UI Elements:**
  - Loading spinner
  - Success/error cards
  - Invoice number display
  - Action buttons
  - Message text

### 2. **app/payment/stripe/** (Stripe Payments)
- **Path:** `/payment/stripe/*`
- **Purpose:** Stripe payment integration
- **Status:** Directory exists; specific implementation requires file reading

---

## ITINERARY SECTION: app/itinerary/

### 1. **app/itinerary/page.tsx** (Itinerary Builder)
- **Path:** `/itinerary`
- **Purpose:** AI-powered trip planning tool
- **Key Features:**
  - Multi-step itinerary builder:
    - Budget selection (Budget, Mid-Range, Luxury)
    - Trip purpose (Trekking, Tourism, Honeymoon, Family)
    - Travel dates (start/end date)
    - Number of nights
  - Cities selection from predefined list:
    - Kathmandu, Pokhara, Chitwan, Nagarkot, Lumbini
  - Itinerary generation:
    - Suggested stops with nights allocation
    - Highlights for each stop
    - Hotel suggestions per stop (with pricing)
    - Travel between cities info
    - Total estimated cost breakdown
  - Timeline visualization:
    - Stop sequence with check-in/check-out dates
    - Hotel suggestions for each stop
    - Cost per stop and total
  - Interactive hotel selection and booking
- **Routes Created:** `/itinerary`
- **API Calls:**
  - Generate itinerary (AI-powered)
  - Hotel suggestions per city
  - Booking from itinerary
- **User Roles:** All
- **UI Elements:**
  - Multi-step form (budget/purpose/dates)
  - City selector with checkboxes
  - Hotel cards in carousel
  - Timeline visualization
  - Cost breakdown cards
  - Action buttons (Book Now)
  - Icons for budget options and purposes

---

## STATS SECTION: app/stats/

### 1. **app/stats/page.tsx** (Platform Statistics)
- **Path:** `/stats`
- **Purpose:** Public platform statistics dashboard
- **Key Features:**
  - Overview metrics:
    - Total hotels on platform
    - Total bookings
    - Total visitors/users
    - Monthly bookings (with growth %)
    - Foreign guests count
  - Charts:
    - Hotels by city (bar chart)
    - Hotels by property type (pie chart)
  - Top hotels ranking:
    - Hotel name, city, star rating
    - Booking count and review count
    - Hotel image
  - Data generation timestamp
- **Routes Created:** `/stats`
- **API Calls:** `GET /api/stats`
- **User Roles:** All (public)
- **UI Elements:**
  - Stat cards with icons and trend indicators
  - Bar chart (Recharts)
  - Pie chart (Recharts)
  - Hotel ranking cards
  - Color-coded sections

---

## API SECTION: app/api/

### Authentication APIs

#### **app/api/auth/register/route.ts**
- **Endpoint:** `POST /api/auth/register`
- **Purpose:** Create new user account
- **Input:** name, email, password, phone, role (CUSTOMER|VENDOR)
- **Output:** success, user data (id, name, email, role), or error
- **Database:** Creates record in User table
- **Auth:** Public
- **Validation:** Zod schema
- **Password:** Hashed with bcrypt

#### **app/api/auth/[...nextauth]/route.ts**
- **Endpoint:** NextAuth configuration
- **Purpose:** Session management, credentials provider
- **Providers:** Credentials (email/password), likely OAuth
- **Callbacks:** Session updates, JWT handling
- **Auth:** Handles all auth logic

---

### Booking APIs

#### **app/api/bookings/route.ts**
- **Endpoint:** `GET /api/bookings`, `POST /api/bookings`
- **GET Purpose:** Fetch bookings with role-based filtering
  - CUSTOMER: Own bookings only
  - VENDOR: Their hotel's bookings
  - STAFF: Their assigned hotel's bookings
  - ADMIN: All bookings
- **GET Query Params:** ?status, ?hotelId, ?limit, ?page
- **POST Purpose:** Create new booking
- **POST Input:** hotelId, roomId, checkIn, checkOut, adults, children, notes, guestNationality, passportNumber, purposeOfVisit
- **Validation:** Check-out must be after check-in
- **Output:** Booking object or error

#### **app/api/bookings/[id]/route.ts**
- **Endpoint:** `GET /api/bookings/{id}`, `PATCH /api/bookings/{id}`, `DELETE /api/bookings/{id}`
- **GET:** Fetch specific booking details
- **PATCH:** Update booking status (PENDING → CONFIRMED → CHECKED_IN → CHECKED_OUT)
- **DELETE:** Cancel booking

#### **app/api/bookings/[id]/refund/route.ts**
- **Endpoint:** `POST /api/bookings/{id}/refund`
- **Purpose:** Request refund for booking
- **Logic:** Calculates refund amount based on cancellation policy
- **Output:** Refund details (amount, percentage)

---

### Hotel APIs

#### **app/api/hotels/route.ts**
- **Endpoint:** `GET /api/hotels`, `POST /api/hotels`
- **GET Purpose:** Public search with filters
  - Query Params: ?city, ?q (search), ?stars, ?type, ?minPrice, ?maxPrice, ?amenities, ?page, ?limit
  - Only returns APPROVED hotels
  - Filter by amenities array match
  - Price filter checks rooms with isActive=true
- **GET Output:** Paginated hotel array with room info
- **POST Purpose:** Create new hotel listing (VENDOR only)
- **Auth:** POST requires VENDOR role

#### **app/api/hotels/[slug]/route.ts**
- **Endpoint:** `GET /api/hotels/{slug}`, `PUT /api/hotels/{slug}`
- **GET:** Fetch single hotel with:
  - Rooms, reviews, average ratings
  - Wishlist status (if user authenticated)
  - Recommendations (similar hotels)
- **PUT:** Update hotel (VENDOR only)

---

### Payment APIs

#### **app/api/payment/khalti/route.ts**
- **Endpoint:** `POST /api/payment/khalti` (initiate), `GET` (check status)
- **Purpose:** Initialize Khalti payment gateway
- **Input:** bookingId, amount, returnUrl
- **Output:** Khalti payment URL (pidx)

#### **app/api/payment/khalti/verify/route.ts**
- **Endpoint:** `POST /api/payment/khalti/verify`
- **Purpose:** Verify Khalti payment after callback
- **Input:** pidx (payment ID), bookingId
- **Output:** success status, invoice number
- **Database:** Updates booking payment status

#### **app/api/payment/stripe/** (Stripe integrations)
- Similar structure for Stripe payment handling

---

### Admin APIs

#### **app/api/admin/stats/route.ts**
- **Endpoint:** `GET /api/admin/stats`
- **Purpose:** Dashboard metrics
- **Output:** totalHotels, totalUsers, totalBookings, revenueThisMonth, revenueGrowth, roomCounts by status, etc.
- **Auth:** ADMIN only

#### **app/api/admin/hotels/route.ts**
- **Endpoint:** `GET /api/admin/hotels`, `PATCH /api/admin/hotels/{id}`
- **GET:** List hotels with optional ?status filter
- **PATCH:** Update hotel status (PENDING → APPROVED/REJECTED), set rejection reason
- **Auth:** ADMIN only

#### **app/api/admin/users/route.ts**
- **Endpoint:** `GET /api/admin/users`, `PATCH /api/admin/users/{id}`
- **GET:** List users with optional ?role filter
- **PATCH:** Update user (isActive, role)
- **Auth:** ADMIN only

#### **app/api/admin/reviews/route.ts**
- **Endpoint:** `GET /api/admin/reviews`, `PATCH /api/admin/reviews`
- **GET:** List reviews with optional ?visible filter
- **PATCH:** Update review visibility (isVisible toggle)
- **Auth:** ADMIN only

#### **app/api/admin/audit/route.ts**
- **Endpoint:** `GET /api/admin/audit?from={date}&to={date}`
- **Purpose:** Generate IRD-compliant financial report
- **Output:** Period, summary (revenue, refunds, counts), detailed invoice/credit note records, AI summary
- **Auth:** ADMIN only

#### **app/api/admin/invoice/route.ts**
- **Endpoint:** `POST /api/admin/invoice`
- **Purpose:** Issue invoice for cash payments
- **Input:** bookingId
- **Output:** invoiceNumber, pdfUrl
- **Auth:** ADMIN only

#### **app/api/admin/refunds/route.ts**
- **Endpoint:** `PATCH /api/admin/refunds`
- **Purpose:** Manually process refund
- **Input:** bookingId
- **Output:** refund status
- **Auth:** ADMIN only

---

### Vendor APIs

#### **app/api/vendor/hotel/route.ts**
- **Endpoint:** `GET /api/vendor/hotel`, `POST /api/vendor/hotel`, `PUT /api/vendor/hotel`
- **GET:** Get vendor's hotel listing (or empty if none)
- **POST:** Create hotel listing (submission for approval)
- **PUT:** Update existing hotel listing
- **Auth:** VENDOR only

#### **app/api/vendor/rooms/route.ts**
- **Endpoint:** `GET /api/vendor/rooms`, `POST /api/vendor/rooms`
- **GET:** List rooms for vendor's hotel
- **POST:** Create new room type
- **Auth:** VENDOR only

#### **app/api/vendor/rooms/{id}/route.ts**
- **Endpoint:** `PUT /api/vendor/rooms/{id}`, `DELETE /api/vendor/rooms/{id}`
- **PUT:** Update room details
- **DELETE:** Remove room type
- **Auth:** VENDOR only

#### **app/api/vendor/stats/route.ts**
- **Endpoint:** `GET /api/vendor/stats`
- **Purpose:** Dashboard metrics for vendor
- **Output:** Hotel status, bookings count, revenue, reviews, room status breakdown
- **Auth:** VENDOR only

#### **app/api/vendor/analytics/route.ts**
- **Endpoint:** `GET /api/vendor/analytics`
- **Purpose:** Detailed performance analytics
- **Output:** KPIs, revenue by month, bookings by day, room performance, guest breakdown, payment methods, peak days
- **Auth:** VENDOR only

---

### Staff APIs

#### **app/api/staff/rooms/route.ts**
- **Endpoint:** `GET /api/staff/rooms`
- **Purpose:** Get rooms for staff's assigned hotel
- **Output:** Room list with current status
- **Auth:** STAFF only

#### **app/api/staff/rooms/{id}/status/route.ts**
- **Endpoint:** `PATCH /api/staff/rooms/{id}/status`
- **Purpose:** Update room status (AVAILABLE, OCCUPIED, CLEANING, MAINTENANCE)
- **Input:** status
- **Auth:** STAFF only

---

### FNMIS APIs

#### **app/api/fnmis/route.ts**
- **Endpoint:** `GET /api/fnmis`, `POST /api/fnmis`
- **GET:** List foreign guest bookings requiring FNMIS reporting
- **POST:** Report single booking to FNMIS
- **Input (POST):** bookingId
- **Output:** FNMIS status, deadline, hours remaining
- **Auth:** ADMIN only (compliance requirement)

---

### Other APIs

#### **app/api/wishlist/route.ts**
- **Endpoint:** `GET /api/wishlist`, `POST /api/wishlist`
- **GET:** Get customer's wishlist
- **POST:** Add/remove hotel from wishlist (toggle)
- **Input:** hotelId
- **Auth:** CUSTOMER only (requires auth)

#### **app/api/user/profile/route.ts**
- **Endpoint:** `PATCH /api/user/profile`
- **Purpose:** Update user profile
- **Input:** name, phone, address
- **Auth:** Authenticated users

#### **app/api/availability/route.ts**
- **Endpoint:** Check room availability for date range
- **Purpose:** Real-time availability checking
- **Input:** roomId, checkIn, checkOut
- **Output:** available (boolean)

#### **app/api/chat/route.ts**
- **Purpose:** Live chat support API
- **Likely:** WebSocket or polling-based chat

#### **app/api/weather/route.ts**
- **Purpose:** Get weather data for hotel location
- **Input:** latitude, longitude
- **Output:** Weather forecast

#### **app/api/currency/route.ts**
- **Purpose:** Currency conversion (likely USD to NPR)
- **Output:** Exchange rates

#### **app/api/metrics/route.ts**
- **Purpose:** Platform analytics metrics
- **Auth:** Public or Admin

#### **app/api/cron/route.ts**
- **Purpose:** Scheduled tasks (FNMIS deadline check, payment processing, etc.)
- **Auth:** Cron token validation

#### **app/api/sms/route.ts**
- **Purpose:** SMS notifications (booking confirmation, payment, etc.)
- **Provider:** Likely Twilio or local SMS provider

#### **app/api/loyalty/route.ts**
- **Purpose:** Loyalty program management
- **Input:** bookingId, guestId
- **Output:** Points earned, rewards status

#### **app/api/pms/route.ts**
- **Purpose:** Property Management System API integrations
- **Features:** Room sync, reservations sync

#### **app/api/uploadthing/route.ts**
- **Purpose:** Image upload handling via UploadThing
- **Auth:** Authenticated users

#### **app/api/public/** (Public stats)
- **Purpose:** Public-facing statistics and analytics

---

## KEY FEATURES SUMMARY

### By User Role:

#### **ADMIN** (Complete Platform Control)
- Dashboard with all metrics
- Hotel approval/rejection
- User account management
- Booking oversight and refund processing
- Review moderation
- FNMIS compliance tracking
- IRD-compliant audit reports
- Revenue analytics

#### **VENDOR** (Hotel Owner)
- Create/edit hotel listing
- Room management
- Booking dashboard
- Guest review management
- Performance analytics
- PMS integration
- Revenue tracking by room type

#### **STAFF** (Hotel Employee)
- Room status management (CLEANING, OCCUPIED, etc.)
- Check-in/check-out processing
- Booking information access
- PMS operations
- Guest interaction data

#### **CUSTOMER** (Guest)
- Browse and search hotels
- Hotel comparison
- Wishlist management
- Booking creation and management
- Payment (Khalti, Stripe, Cash)
- Cancellation and refunds
- Review submission
- Profile management
- Trip itinerary planning

#### **PUBLIC** (Unauthenticated)
- Browse hotels
- View hotel details
- See platform statistics
- Create account (register)
- Login

### By Feature:

#### **Payment Processing**
- Khalti integration (Nepal's leading payment gateway)
- Stripe integration (international cards)
- Cash on arrival
- Invoice generation (IRD-compliant)
- Refund management

#### **Compliance**
- FNMIS reporting (24-hour foreign guest requirement)
- IRD-compliant invoices
- Audit report generation
- Financial tracking

#### **Booking Management**
- Dynamic pricing
- Occupancy management
- Overbooking alerts
- Cancellation policies
- Refund calculations

#### **Calendar Support**
- BS (Bikram Sambat) date display alongside AD dates
- Calendar context for entire app
- Nepali date calculations

#### **Advanced Features**
- Offline support (PWA, service worker)
- AI-powered itinerary builder
- Weather widget
- Carbon footprint calculation
- Virtual tours
- Live chat support
- Hotel comparison tool
- Loyalty program
- Dynamic pricing strategies
- OTA integration (potential)

---

## TECHNICAL STACK

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS
- **UI Components:** Lucide React icons
- **Forms:** React Hook Form + Zod validation
- **Data Fetching:** TanStack Query (React Query)
- **Charts:** Recharts
- **Maps:** Leaflet (HotelMap)
- **Image Upload:** UploadThing
- **Auth:** NextAuth.js with credentials provider
- **Session Management:** NextAuth + SessionProvider
- **Date Handling:** date-fns
- **File Uploads:** UploadButton (UploadThing)
- **SEO:** Next.js metadata API

### Backend
- **ORM:** Prisma
- **Database:** (Likely PostgreSQL)
- **Payment:** Khalti SDK, Stripe SDK
- **SMS:** (Likely Twilio or local provider)
- **Email:** (Node mailer or service)
- **FNMIS:** Government API integration

### Deployment
- **Hosting:** Vercel (optimal for Next.js)
- **CDN:** UploadThing for image hosting
- **Service Worker:** PWA support

---

## USER FLOW EXAMPLES

### Customer Booking Flow
1. Public user browses `/hotels`
2. Clicks on hotel → `/hotels/{slug}` (detail view)
3. Selects room and dates → Booking modal
4. Enters guest info (including nationality for FNMIS)
5. Selects payment method:
   - Khalti → Redirected to Khalti payment → `/payment/success`
   - Stripe → Similar payment flow
   - Cash → Booking confirmed, pay at hotel
6. On successful payment → Invoice generated
7. Confirmation email sent
8. Customer can view booking at `/customer/bookings`
9. Customer can cancel/refund (with percentage based on policy)
10. After checkout, can write review at `/hotels/{slug}`

### Vendor Setup Flow
1. User registers as VENDOR at `/register`
2. Redirected to `/vendor` (dashboard)
3. Creates hotel listing at `/vendor/hotel`
4. Submission marked as PENDING
5. Admin reviews at `/admin/hotels`
6. Admin APPROVES → Vendor creates rooms at `/vendor/rooms`
7. Rooms become bookable on `/hotels`
8. Vendor monitors bookings at `/vendor/bookings`
9. Vendor checks analytics at `/vendor/analytics`
10. Vendor responds to reviews at `/vendor/reviews`

### Admin Compliance Flow
1. Admin logs in → `/admin`
2. Sees FNMIS overdue alert
3. Navigates to `/admin/fnmis`
4. Reviews foreign guest bookings
5. Manually reports or triggers auto-report
6. Generates audit report at `/admin/audit` for IRD
7. Reviews pending hotel approvals at `/admin/hotels`
8. Approves/rejects with feedback
9. Processes refunds at `/admin/bookings`

---

## DATA FLOW & API HIERARCHY

```
Public Routes (No Auth Required)
├── /hotels (search/browse)
├── /hotels/{slug} (details)
├── /stats (platform metrics)
├── /login (authentication)
└── /register (account creation)

Authenticated Routes
├── CUSTOMER
│   ├── /customer/bookings (view/manage)
│   ├── /customer/profile (account settings)
│   ├── /customer/wishlist (saved hotels)
│   └── /payment/* (checkout)
├── VENDOR
│   ├── /vendor (dashboard)
│   ├── /vendor/hotel (manage listing)
│   ├── /vendor/rooms (manage inventory)
│   ├── /vendor/bookings (monitor reservations)
│   ├── /vendor/analytics (performance)
│   ├── /vendor/reviews (guest feedback)
│   └── /vendor/pms (operations)
├── STAFF
│   ├── /staff (operations dashboard)
│   └── /staff/pms (advanced operations)
└── ADMIN
    ├── /admin (overview)
    ├── /admin/hotels (approvals)
    ├── /admin/users (account management)
    ├── /admin/bookings (oversight)
    ├── /admin/fnmis (compliance)
    ├── /admin/reviews (moderation)
    └── /admin/audit (financial reports)

Shared Routes (Multiple Roles)
├── /itinerary (all users - trip planning)
└── /offline (all users - PWA fallback)
```

---

## SUMMARY TABLE

| Section | File | Path | Route(s) | Purpose | Auth Required |
|---------|------|------|----------|---------|----------------|
| Root | page.tsx | / | / | Role-based redirect | Yes |
| Root | layout.tsx | - | - | Global wrapper | - |
| Root | globals.css | - | - | Tailwind + utilities | - |
| Root | error.tsx | - | - | Error boundary | - |
| Root | loading.tsx | - | - | Loading fallback | - |
| Root | not-found.tsx | - | /404 | Page not found | No |
| Special | offline/page.tsx | /offline | /offline | Offline fallback | No |
| Special | unauthorized/page.tsx | /unauthorized | /unauthorized | Access denied | No |
| Auth | (auth)/login/page.tsx | /login | /login | User login | No |
| Auth | (auth)/register/page.tsx | /register | /register | Account creation | No |
| Admin | admin/page.tsx | /admin | /admin | Dashboard | ADMIN |
| Admin | admin/hotels/page.tsx | /admin/hotels | /admin/hotels | Hotel approvals | ADMIN |
| Admin | admin/users/page.tsx | /admin/users | /admin/users | User management | ADMIN |
| Admin | admin/bookings/page.tsx | /admin/bookings | /admin/bookings | Booking oversight | ADMIN |
| Admin | admin/fnmis/page.tsx | /admin/fnmis | /admin/fnmis | FNMIS compliance | ADMIN |
| Admin | admin/reviews/page.tsx | /admin/reviews | /admin/reviews | Review moderation | ADMIN |
| Admin | admin/audit/page.tsx | /admin/audit | /admin/audit | Financial reports | ADMIN |
| Vendor | vendor/page.tsx | /vendor | /vendor | Vendor dashboard | VENDOR |
| Vendor | vendor/hotel/page.tsx | /vendor/hotel | /vendor/hotel | Hotel listing | VENDOR |
| Vendor | vendor/rooms/page.tsx | /vendor/rooms | /vendor/rooms | Room management | VENDOR |
| Vendor | vendor/bookings/page.tsx | /vendor/bookings | /vendor/bookings | Bookings view | VENDOR |
| Vendor | vendor/analytics/page.tsx | /vendor/analytics | /vendor/analytics | Performance data | VENDOR |
| Vendor | vendor/reviews/page.tsx | /vendor/reviews | /vendor/reviews | Guest reviews | VENDOR |
| Staff | staff/page.tsx | /staff | /staff | Operations | STAFF |
| Customer | customer/bookings/page.tsx | /customer/bookings | /customer/bookings | My bookings | CUSTOMER |
| Customer | customer/profile/page.tsx | /customer/profile | /customer/profile | Profile | CUSTOMER |
| Customer | customer/wishlist/page.tsx | /customer/wishlist | /customer/wishlist | Saved hotels | CUSTOMER |
| Hotels | hotels/page.tsx | /hotels | /hotels | Browse hotels | No |
| Hotels | hotels/[slug]/page.tsx | /hotels/{slug} | /hotels/{slug} | Hotel details | No |
| Payment | payment/success/page.tsx | /payment/success | /payment/success | Payment confirmation | CUSTOMER |
| Itinerary | itinerary/page.tsx | /itinerary | /itinerary | Trip planner | No |
| Stats | stats/page.tsx | /stats | /stats | Platform stats | No |

---

**Document Generated:** May 8, 2026  
**Application:** NepalStay Hotel Booking Platform  
**Version:** Comprehensive App Structure Analysis

This document provides a complete exploration of every page, component, route, API endpoint, and feature within the NepalStay application.
