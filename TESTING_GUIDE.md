# 🧪 Testing Guide - Verification Steps

## Pre-Testing Setup

```bash
# Ensure database is seeded with demo data
SEED_MODE=demo npm run seed

# Start development server
npm run dev

# Access the app at http://localhost:3000
```

---

## Test 1: Register as Nepali Traveller

**Steps:**
1. Go to `/register`
2. Select "🏨 Traveller" role
3. Fill in: Name, Email, Phone
4. **VERIFY**: Nationality selector appears
5. Select "🇳🇵 Nepali Citizen"
6. **VERIFY**: NO passport fields appear
7. **VERIFY**: NO purpose of visit field appears
8. Enter password and confirm password
9. Click "Create Account"
10. **VERIFY**: Account created successfully

**Expected Result:** ✅ Form only shows nationality, no passport fields

---

## Test 2: Register as Foreign Traveller

**Steps:**
1. Go to `/register`
2. Select "🏨 Traveller" role
3. Fill in: Name, Email, Phone
4. Select "🌍 Foreign Tourist"
5. **VERIFY**: Passport Number field appears with *
6. **VERIFY**: Purpose of Visit field appears with *
7. Try submitting without passport → **VERIFY**: Error shows
8. Try submitting without purpose → **VERIFY**: Error shows
9. Enter passport (minimum 6 chars) and purpose
10. Create account

**Expected Result:** ✅ Both passport fields required, validation works

---

## Test 3: Register as Hotel Owner (Vendor)

**Steps:**
1. Go to `/register`
2. Select "🏢 Hotel Owner" role
3. Fill in: Name, Email, Phone
4. **VERIFY**: Nationality selector is NOT visible
5. **VERIFY**: Passport field is NOT visible
6. **VERIFY**: Purpose of visit field is NOT visible
7. Enter password
8. Create account

**Expected Result:** ✅ No nationality/passport fields for vendors

---

## Test 4: Try to Fake Foreign Vendor

**Steps:**
1. Go to `/register`
2. Select "🏢 Hotel Owner" role
3. **VERIFY**: Cannot select "Foreign Tourist" (field hidden)
4. Account will be created as NEPALI automatically
5. Cannot change after creation

**Expected Result:** ✅ Vendors cannot pretend to be foreign

---

## Test 5: Login with Demo Credentials

### Nepali Customer:
```
Email: traveler@example.com
Password: password123
```
**Expected:** Login successful, dashboard loads

### Foreign Customer:
```
Email: foreign@example.com
Password: password123
```
**Expected:** Login successful, dashboard loads

### Vendor:
```
Email: rajesh@urbanboutique.com
Password: password123
```
**Expected:** Login successful, vendor dashboard loads

### Admin:
```
Email: admin@nepalstay.com
Password: admin123
```
**Expected:** Login successful, admin panel loads

---

## Test 6: Profile Page - Nepali Citizen

**Steps:**
1. Login as `traveler@example.com`
2. Go to `/customer/profile`
3. **VERIFY**: Name, Phone, Address fields visible (editable)
4. **VERIFY**: Email field visible (readonly)
5. **VERIFY**: Nationality field visible as "Nepali Citizen" (readonly)
6. **VERIFY**: NO passport number field
7. **VERIFY**: NO purpose of visit field

**Expected Result:** ✅ Clean profile without foreign-only fields

---

## Test 7: Profile Page - Foreign Traveller

**Steps:**
1. Login as `foreign@example.com`
2. Go to `/customer/profile`
3. **VERIFY**: Name, Phone, Address fields visible (editable)
4. **VERIFY**: Email field visible (readonly)
5. **VERIFY**: Nationality field visible as "Foreign Tourist" (readonly)
6. **VERIFY**: Passport Number field appears (readonly)
7. **VERIFY**: Purpose of Visit field appears (readonly)
8. Try to edit passport → **VERIFY**: Cannot edit (disabled)
9. Try to edit purpose → **VERIFY**: Cannot edit (disabled)

**Expected Result:** ✅ All passport info visible but readonly

---

## Test 8: Vendor Hotel Management

### First Time:
**Steps:**
1. Login as `rajesh@urbanboutique.com`
2. Go to `/vendor/hotel`
3. **VERIFY**: Page says "Create Hotel Listing"
4. **VERIFY**: No status banner yet
5. Fill in hotel details
6. Click "Submit for Approval"
7. **VERIFY**: Form switches to "Edit Hotel Listing"
8. **VERIFY**: Status banner appears (PENDING)

### Second Time:
**Steps:**
1. Refresh page while logged in as same vendor
2. **VERIFY**: Page says "Edit Hotel Listing"
3. **VERIFY**: All previous data is pre-filled
4. **VERIFY**: Status banner shows "PENDING"
5. Edit any field
6. Click "Save Changes"
7. **VERIFY**: Changes saved successfully

**Expected Result:** ✅ Can create and edit hotel, status tracks progression

---

## Test 9: Seed Generation

**Steps:**
```bash
SEED_MODE=demo npm run seed
```

**Verify console output:**
```
✅ Cleaned up
✅ Users created
✅ Hotels created
✅ 8 rooms created for Hotel 1
✅ 32 rooms created for Hotel 2
✅ Bookings created
✅ Reviews created
✓ Seeding completed
```

**Expected Result:** ✅ No type errors, all data seeded successfully

---

## Test 10: Validation Edge Cases

### Case 1: Foreign without Passport
- Register as Foreign, leave passport empty
- **Expected:** Validation error: "Passport number required"

### Case 2: Foreign without Purpose
- Register as Foreign, with passport but no purpose
- **Expected:** Validation error: "Purpose of visit required"

### Case 3: Vendor as Foreign
- Register as Vendor, somehow try to be Foreign
- **Expected:** Cannot select Foreign (UI prevents it)

### Case 4: Nepali Traveller with Passport
- Register as Nepali, passport field shouldn't exist
- **Expected:** No passport in form data sent to server

---

## Test 11: Database Integrity

**Steps:**
```bash
# After running seed, check database
npx prisma studio

# Check User table
# - Nepali customers should have: nationality = "NEPALI"
# - Foreign customers should have: nationality = "FOREIGN", passportNumber filled
# - All vendors should have: nationality = "NEPALI"

# Check Room table
# - All rooms should have proper RoomType enum values
# - No string values in type field
```

**Expected Result:** ✅ All data properly stored and typed

---

## Test 12: Cross-Browser Validation

**Test on:**
- Chrome/Chromium ✓
- Firefox ✓
- Safari ✓
- Mobile browsers ✓

**Verify:**
- Form validation works client-side
- Fields show/hide correctly
- Readonly fields cannot be edited
- Error messages display properly

---

## Checklist

### Signup Flow ✓
- [ ] Nepali traveller signup (no passport fields)
- [ ] Foreign traveller signup (passport required)
- [ ] Vendor signup (no nationality fields)
- [ ] Cannot fake foreign vendor
- [ ] All validations work

### Profile Page ✓
- [ ] Nepali customer profile (no passport)
- [ ] Foreign customer profile (passport readonly)
- [ ] Cannot edit passport after registration
- [ ] All info matches signup data

### Vendor Dashboard ✓
- [ ] Create hotel (first time)
- [ ] Edit hotel (subsequent times)
- [ ] Status tracking works
- [ ] All previous data retained

### Demo Credentials ✓
- [ ] Admin login works
- [ ] Vendor login works
- [ ] Staff login works
- [ ] Customer login works (both types)

### Database ✓
- [ ] Seed runs without errors
- [ ] RoomType enum properly used
- [ ] No string values in type field
- [ ] All demo data created

---

## Notes

- All tests should complete without errors
- No console warnings related to types
- Form validation works before submission
- Backend validation catches any tampering
- Profile page renders correctly based on nationality

---

**Testing Status**: Ready to verify ✅  
**Expected Completion**: < 30 minutes  
**Regression Risk**: Low (non-breaking changes)
