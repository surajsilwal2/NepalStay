# NepalStay Voice Search & Chat Setup and Testing Guide

## 🎯 Overview

This document provides step-by-step instructions to:
1. Set up the **free Groq AI API** for the chat feature
2. Test the **voice search** functionality
3. Verify that all improvements work correctly
4. Troubleshoot common issues

---

## ✅ What's Been Fixed

### 1. **Chat Feature** (Anthropic → Groq Free Tier)
- ❌ **Before**: Chat used paid Anthropic API → showed "upgrade subscription" error when out of credits
- ✅ **After**: Chat now uses **free Groq API** (llama-3.1-8b-instant model) with thousands of free requests/month
- **Benefit**: Unlimited free usage for development and testing

### 2. **Voice Search**
- ✅ Enhanced error messages (now show emojis and clear guidance)
- ✅ Retry logic for network errors (automatically retries once)
- ✅ Fallback text input (if voice fails, user can type instead)
- ✅ Diagnostics feature (copy error details for debugging)

### 3. **Database Configuration**
- ✅ Fixed DATABASE_URL encoding (special character @ is now properly escaped as %40)
- ✅ Prevents Prisma connection failures

### 4. **Performance** (Previous Session)
- ✅ Converted images to Next/Image (optimized delivery)
- ✅ Dynamic-imported heavy widgets (ChatWidget, CompareBar, ServiceWorkerRegister)
- ✅ Enabled SWC minification for smaller bundle sizes

---

## 🚀 Setup Instructions (5 minutes)

### Step 1: Get a Free Groq API Key

1. Visit: **https://console.groq.com**
2. Click **"Sign Up"** (free — no credit card required)
3. Verify your email
4. Log in to the console
5. Click **"API Keys"** in the left sidebar
6. Click **"Create API Key"** button
7. Copy your new API key (format: `gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

### Step 2: Add Your Groq API Key to `.env`

1. Open `.env` file in the project root
2. Find this line:
   ```
   GROQ_API_KEY="gsk_your_free_api_key_here"
   ```
3. Replace it with your actual key:
   ```
   GROQ_API_KEY="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```
   (where `xxxxx...` is your actual key from Step 1)
4. **Save the file** (Ctrl+S)

### Step 3: Restart the Dev Server

1. Stop the current dev server (press `Ctrl+C` in the terminal)
2. Restart it:
   ```bash
   npm run dev
   ```
3. Wait for the message: `> ready on http://localhost:3000`

---

## 🧪 Testing Instructions

### Test 1: Chat Feature (Basic)

**Goal**: Verify chat responds correctly without subscription errors

1. Open app at `http://localhost:3000`
2. Locate the **chat widget** (bottom-right corner, message icon)
3. Click to open the chat
4. Type a message: `"Find me a hotel in Pokhara under 2000 NPR"`
5. **Expected outcome**:
   - Chat responds with a recommendation
   - No "upgrade subscription" error
   - If hotels found, they are shown as cards below the response

**Success indicators**:
- ✅ Chat responds within 3 seconds
- ✅ Response is helpful and mentions hotels
- ✅ No API errors in browser console (press F12 → Console tab)

**If it fails**:
- Check browser console (F12 → Console) for errors
- Verify GROQ_API_KEY in `.env` is correct (no typos, starts with `gsk_`)
- Restart dev server again

---

### Test 2: Chat Feature (Hotel Search)

**Goal**: Verify chat can search and recommend hotels

1. Open chat widget
2. Try these search queries one by one:
   - `"Best hotels in Kathmandu for honeymoon"`
   - `"Budget hostel in Pokhara under 1500 NPR"`
   - `"5-star resort in Chitwan"`
3. **Expected outcome**:
   - Chat provides personalized recommendations
   - Hotel cards appear with name, location, price, stars
   - User can click cards to view full hotel details

**Success indicators**:
- ✅ All queries get responses (no timeouts)
- ✅ Hotel cards show correct data (name, city, price)
- ✅ Clicking a hotel card navigates to `/hotels/[slug]`

---

### Test 3: Voice Search (Basic)

**Goal**: Verify voice recognition works without errors

**Prerequisites**: 
- Microphone connected and working
- Browser permissions: Allow microphone access (you'll see a permission prompt)

**Steps**:
1. Navigate to `/hotels` page
2. Look for the **voice search icon** (microphone button)
3. Click the **mic button**
4. Speak clearly: `"hotel in pokhara"`
5. Wait for response (watch for green border around the mic = listening)

**Expected outcomes**:
- ✅ Mic icon changes (green/animated while listening)
- ✅ Your speech is transcribed
- ✅ Search results appear (hotels matching your query)
- ✅ **No error messages** (or error shows helpful guidance)

**Success indicators**:
- ✅ Voice input recognized within 3-5 seconds
- ✅ Transcription appears above the mic button
- ✅ Hotels load based on voice search
- ✅ No red error messages (or error is clear and helpful)

---

### Test 4: Voice Search (Error Handling)

**Goal**: Verify voice search handles errors gracefully

**Scenario A: Deny Microphone Permission**
1. On `/hotels`, click the mic button
2. Browser will ask: "Allow microphone access?" → Click **Block/Deny**
3. **Expected**: Error message appears: `"❌ Microphone access denied. Please enable it in browser settings."`
4. Fallback text input appears so user can type instead
5. ✅ **Success**: Clear error, fallback works

**Scenario B: Speak Nothing (Silence)**
1. Click mic button
2. Browser asks for permission → Allow
3. Stay silent for 5 seconds
4. **Expected**: Error message: `"🔇 No speech detected. Please try again."`
5. User can click **Retry** to try again
6. ✅ **Success**: Clear message, retry available

**Scenario C: Network Error (Simulate)**
1. Open DevTools (F12 → Network tab)
2. Click the mic button and start speaking
3. In DevTools, check the **Throttling** dropdown → Select **Offline**
4. After speech ends, **Expected**: Error with retry option
5. Disable offline mode in DevTools
6. Click **Retry**
7. ✅ **Success**: Voice works again after network is restored

---

### Test 5: Voice Search (Complex Queries)

**Goal**: Verify voice search understands natural language

Try these voice queries on `/hotels`:
1. `"I need a cheap hostel in Kathmandu for backpackers"`
2. `"Show me luxury 5-star hotels in Pokhara under 5000 NPR"`
3. `"Budget resort in Chitwan for families"`
4. `"Boutique hotel in Nagarkot with mountain views"`

**Expected outcomes**:
- ✅ AI extracts: city, budget, property type, purpose
- ✅ Hotels matching criteria appear
- ✅ No errors during transcription

---

## 📊 Performance Testing

### Lighthouse Audit (Chrome DevTools)

**Goal**: Verify performance improvements

1. Open DevTools (F12)
2. Go to **Lighthouse** tab
3. Click **Analyze page load**
4. Wait for audit to complete
5. Note the **Performance score**

**Target**: Ideally ≥ 70 (improved from initial 60)

**Key metrics to check**:
- ✅ **First Contentful Paint (FCP)**: < 2s
- ✅ **Largest Contentful Paint (LCP)**: < 2.5s
- ✅ **Cumulative Layout Shift (CLS)**: < 0.1

**If score is still low** (< 70):
- Check DevTools → Network tab for slow image loads
- Look for unused JavaScript in Coverage tab
- Report score to team for further optimization

---

## 🔍 Troubleshooting

### Issue: Chat shows "Get your FREE Groq API key..."

**Cause**: `GROQ_API_KEY` in `.env` is not set or still has placeholder text

**Fix**:
1. Stop dev server (Ctrl+C)
2. Open `.env` file
3. Check the line: `GROQ_API_KEY="..."`
4. Verify it's NOT `"gsk_your_free_api_key_here"`
5. Replace with your actual key from https://console.groq.com
6. Save (Ctrl+S)
7. Restart dev server: `npm run dev`

---

### Issue: Chat shows "Invalid Groq API key"

**Cause**: API key is invalid or has expired

**Fix**:
1. Go to https://console.groq.com → API Keys
2. Create a new API key (delete old one if needed)
3. Update `.env` with new key
4. Restart dev server

---

### Issue: Voice search shows "Microphone access denied"

**Cause**: Browser doesn't have microphone permission

**Fix** (Chrome):
1. Click the **lock icon** in address bar (next to URL)
2. Find **Microphone** setting
3. Set to **Allow**
4. Refresh the page
5. Try voice search again

**For other browsers**, search "enable microphone permission [your browser name]"

---

### Issue: Voice search shows "No speech detected"

**Cause**: Microphone not working or speech was too quiet

**Fix**:
1. Test microphone on another app (Discord, Teams) to verify it works
2. Speak louder and closer to mic
3. Click **Retry** button to try again
4. Check DevTools Console (F12) for detailed error messages

---

### Issue: Database connection fails (Prisma error)

**Cause**: `DATABASE_URL` in `.env` has encoding issue

**Fix**:
1. Check `.env` → `DATABASE_URL` line
2. Ensure special characters in password are encoded:
   - `@` should be `%40`
   - `:` should be `%3A` (if in password)
3. Example (correct):
   ```
   DATABASE_URL="postgresql://user:NepalStay%40123@host:5432/db"
   ```
4. Restart dev server
5. Check console for connection success message

---

### Issue: Dev server won't start

**Cause**: Port 3000 is already in use

**Fix**:
```bash
npm run dev -- -p 3001
```
(This starts the server on port 3001 instead)

---

## 📝 Files Modified in This Session

| File | Changes | Status |
|------|---------|--------|
| `.env` | Fixed DATABASE_URL encoding; Added GROQ_API_KEY setup instructions | ✅ Ready |
| `app/api/chat/route.ts` | Enhanced error handling; Added key validation; Groq integration | ✅ Ready |
| `components/features/ChatWidget.tsx` | Added setup error display; Better error messaging | ✅ Ready |
| `components/features/VoiceSearch.tsx` | Improved error messages; Fixed fallback state reset | ✅ Ready |

---

## 🎓 How to Use the Features

### Chat Widget

**Location**: Bottom-right corner of any page

**What it can help with**:
- Find hotels by city, budget, type, or purpose
- Get travel tips about Nepal (festivals, trekking, weather)
- Learn about booking process (Khalti, Stripe, FNMIS)
- Understand Nepali calendar (Bikram Sambat)

**Example questions**:
- "Find me a 3-star hotel in Pokhara under 2000 NPR"
- "When is the best time to trek to Everest Base Camp?"
- "How do I book a hotel with Khalti?"
- "What is Dashain? When is it celebrated?"

### Voice Search

**Location**: `/hotels` page, microphone button

**What it can do**:
- Search hotels by speaking naturally
- Understand location, budget, type, and purpose from speech
- Display relevant hotels instantly

**Example queries**:
- "Budget hotel in Kathmandu"
- "Luxury resort in Pokhara under 5000 NPR"
- "Family-friendly hostel in Chitwan"
- "Honeymoon suite in Nagarkot"

---

## ✨ Key Improvements Summary

| Feature | Before | After | Benefit |
|---------|--------|-------|---------|
| **Chat AI** | Anthropic (paid) | Groq free tier | Free, unlimited requests |
| **Chat Errors** | Vague "subscription" error | Clear setup instructions | Users know how to fix |
| **Voice Errors** | Generic messages | Emoji + specific guidance | Better UX, faster fixes |
| **Performance** | ~60 (Lighthouse) | Improved with Image + dynamic imports | Faster load times |
| **Database** | Connection errors from encoding | Fixed encoding | Reliable DB connection |

---

## 📞 Support

If you encounter issues:
1. Check the **Troubleshooting** section above
2. Look at **browser console** (F12 → Console tab) for error messages
3. Check the **terminal** for server-side errors
4. Re-read the error message — it often has helpful hints!

---

## 🎉 Next Steps After Testing

Once all tests pass:
1. ✅ Commit these changes: `git add . && git commit -m "Fix chat (Groq) and voice search improvements"`
2. ✅ Deploy to production (e.g., Vercel)
3. ✅ Monitor performance (Lighthouse, user feedback)
4. ✅ Consider additional optimizations if needed (e.g., image CDN, CSS purging)

---

**Last Updated**: During current session  
**Status**: Ready for testing  
**Next Review**: After user confirms all tests pass
