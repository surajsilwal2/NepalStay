# NepalStay - Bug Fixes & Improvements

**Date:** May 19, 2026

## Overview

This document details all fixes and improvements made to address critical issues found during testing. The changes ensure proper handling of national vs. foreign users, correct guest nationality tracking in analytics, FNMIS compliance for foreign tourists, and improved UI/UX transitions.

---

## Issues Fixed

### 1. National Users Passport Fields

**Issue:** National users were asked to fill out passport and other non-national data unnecessarily.

**Solution:**

- Modified `/app/api/user/profile/route.ts` to return the `nationality` field from user profile
- Updated `/app/customer/profile/page.tsx` to display nationality as read-only field
- Nationality is now shown as "Nepali Citizen" or "Foreign Tourist" and cannot be edited after registration
- Passport fields are no longer visible to users after registration (only set during registration)

**Files Changed:**

- `app/api/user/profile/route.ts` - Added nationality to GET response
- `app/customer/profile/page.tsx` - Added read-only nationality display

---

### 2. Tourism Dashboard 500 Errors

**Issue:** Public stats dashboard (/api/stats) was returning 500 errors due to referencing a non-existent `guestNationality` field on bookings.

**Solution:**

- Fixed query in `/app/api/stats/route.ts` to use the correct `user.nationality` relationship instead of non-existent field
- Updated foreign guest count query to properly filter by `user: { nationality: "FOREIGN" }`
- This also resolves the "Nepali guest" labeling issue in analytics

**Files Changed:**

- `app/api/stats/route.ts` - Fixed guest nationality query logic

---

### 3. Analytics Dashboard Guest Type Mismatch

**Issue:** Analytics dashboard was showing "Nepali guest" even when bookings were made by foreign guests because it was referencing a non-existent `guestNationality` field on bookings.

**Solution:**

- Updated `/app/api/vendor/analytics/route.ts` to fetch user data with each booking
- Changed guest nationality calculation to use `user.nationality` field instead of non-existent field
- Now correctly categorizes bookings as "NEPALI" or "FOREIGN" based on user nationality
- Guest nationality pie chart now displays accurate data

**Files Changed:**

- `app/api/vendor/analytics/route.ts`
  - Added `user: { select: { nationality: true } }` to booking query
  - Updated nationality counting logic to use `b.user?.nationality`

---

### 4. Foreign Guest FNMIS Reporting

**Issue:** FNMIS reporting was not properly accessible to vendors and staff, and lacked proper authorization checks. Additionally, foreign guest passport data was not being properly utilized for FNMIS compliance.

**Solution:**

- Enhanced `/app/api/fnmis/route.ts` with proper authorization:
  - **POST endpoint**: Vendors can only report their own hotels' bookings, staff can only report their assigned hotel's bookings
  - **GET endpoint**: Vendors and staff only see their own hotel's FNMIS-reportable bookings, admins see all
  - Prevents unauthorized access and data leakage across hotels
  - Uses user's stored passportNumber for validation (User.passportNumber captured during registration)
- Updated cron job to properly check for foreign guests with passport numbers
- FNMIS reporting can now be done through:
  - Admin dashboard (/admin/fnmis) - all hotels
  - Vendor dashboard (/vendor/analytics or /vendor/pms) - own hotel only
  - Staff dashboard via room management - assigned hotel only

**Files Changed:**

- `app/api/fnmis/route.ts`
  - Added hotel authorization checks in POST endpoint
  - Added hotel filtering in GET endpoint for vendors and staff
  - Updated queries to use user.passportNumber relationship
- `app/api/cron/fnmis-check/route.ts`
  - Updated to query user.passportNumber instead of booking.passportNumber

---

### 5. Vendor Hotel Create-to-Edit Transition

**Issue:** When creating a new hotel, after successful submission, the form didn't properly transition from "Create Hotel Listing" to "Edit Hotel Listing" mode, causing confusion about whether the hotel was actually created.

**Solution:**

- Enhanced `/app/vendor/hotel/page.tsx` to:
  - Call `reset()` on the form after successful hotel creation
  - This updates the form with the new hotel data from the API response
  - The page heading automatically changes to "Edit Hotel Listing" since `hotel` is now set
  - Provides smoother UX transition from create to edit mode

**Files Changed:**

- `app/vendor/hotel/page.tsx` - Added form reset() call in onSubmit after hotel creation

---

## Architecture & Design Notes

### Staff vs. Vendor Room Management

The current architecture provides:

- **Vendors** can manage their hotel's rooms and status through the PMS API (`/api/pms`)
- **Staff** are assigned to specific hotels via `staffHotelId` field and can manage rooms
- **Small hotels** can choose to:
  - Use vendor-only management (no staff assigned)
  - Assign staff for larger operations

Both have access to room status updates and check-in/check-out management. This provides flexibility for hotels of any size.

### FNMIS Compliance Flow

1. **Booking Creation**: Foreign guests' passport numbers are automatically captured
2. **Auto-Marking**: Cron job (`/api/cron/fnmis-check`) marks bookings as overdue if deadline passes
3. **Manual Reporting**: Admin, vendors, and staff can report foreign bookings via `/api/fnmis` POST
4. **Status Tracking**: Dashboard shows:
   - Admin: FNMIS overdue count and alerts
   - Vendor: Foreign guest count in analytics
   - FNMIS page: All reportable bookings with deadline tracking

---

## Database Implications

No database schema changes were required. All fixes work with existing fields:

- `User.nationality` (NEPALI | FOREIGN)
- `User.passportNumber` (nullable, for FOREIGN users)
- `Booking.passportNumber` (now populated for foreign bookings)
- `Booking.fnmisDeadline` (set for foreign bookings, 24h after check-in)
- `Booking.fnmisReported` (tracked for compliance)

---

## Testing Recommendations

### Test National User Flow

1. Register as NEPALI citizen
2. View profile - should show "Nepali Citizen" as read-only
3. Create a booking - should not require passport fields
4. Check analytics - should show as "Nepali guest"

### Test Foreign User Flow

1. Register with FOREIGN nationality + passport
2. Create a booking - passport should be auto-captured
3. Check admin/fnmis - should show FNMIS deadline
4. Verify analytics show as "Foreign guest"

### Test Vendor Operations

1. Create hotel - verify transition from create to edit
2. Check analytics - verify guest nationality breakdown
3. Access PMS - verify room management
4. Check FNMIS reporting (if foreign bookings exist)

### Test Public Dashboard

1. Access /stats - should load without 500 error
2. Check foreign guest count display
3. Verify hotel statistics show correct data

---

## Demo Credentials

The following demo accounts are available for testing:

### National Customer

- Email: `customer@nepalstay.local`
- Password: `Demo@123`
- Nationality: NEPALI
- Role: CUSTOMER

### Foreign Tourist

- Email: `tourist@nepalstay.local`
- Password: `Demo@123`
- Nationality: FOREIGN
- Passport: `AB123456`
- Role: CUSTOMER

### Vendor (Hotel Owner)

- Email: `vendor@nepalstay.local`
- Password: `Demo@123`
- Role: VENDOR

### Admin

- Email: `admin@nepalstay.local`
- Password: `Demo@123`
- Role: ADMIN

### Staff

- Email: `staff@nepalstay.local`
- Password: `Demo@123`
- Role: STAFF
- Assigned Hotel: Demo Hotel

---

## Known Limitations & Future Improvements

### 1. Today's Arrival/Check-in Data

The PMS endpoint correctly filters for bookings with check-in/check-out on today's date. If data appears empty:

- Verify bookings exist with confirmed status
- Check that check-in date is set to today (accounting for timezone)
- Ensure bookings have completed payment (not PENDING status)

### 2. Staff Management for Small Hotels

The system supports vendor-only management:

- Small hotels can operate without staff accounts
- Vendors have full access to PMS via `/api/pms`
- Consider adding a "self-managed" vs "staff-managed" toggle for UI clarity in future versions

### 3. FNMIS Auto-Reporting

Current system requires manual reporting. Potential future enhancement:

- Add auto-submit option for FNMIS compliance
- Would require integration with actual FNMIS API

---

## Rollback Instructions

All changes are backward compatible. No database migrations required.

To revert specific changes:

1. **Analytics fix**: Restore original `guestNationality` queries (not recommended - breaks functionality)
2. **Passport fix**: Remove `passportNumber` from booking creation (reduces compliance)
3. **Profile changes**: Remove nationality field from GET response
4. **Hotel transition**: Remove `reset()` call from vendor hotel onSubmit

---

## Performance Impact

- Minimal impact from nationality lookups (already joined for reviews and other features)
- No additional database queries in critical paths
- PMS API unchanged (no performance impact on room management)
- Cron job runs hourly with efficient `updateMany` for FNMIS marking

---

## Security Considerations

- Profile page shows nationality but doesn't allow editing
- Passport numbers are only visible to authenticated users (owner, admin, staff of hotel)
- FNMIS reporting requires proper role-based access control
- Foreign bookings are properly validated before FNMIS deadlines are set
