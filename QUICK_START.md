# ⚡ Quick Setup Checklist

## 1️⃣ Get Groq API Key (2 minutes)
- [ ] Visit https://console.groq.com
- [ ] Sign up (free, no credit card)
- [ ] Create an API key
- [ ] Copy the key (starts with `gsk_`)

## 2️⃣ Add Key to `.env` (1 minute)
- [ ] Open `.env` file
- [ ] Find: `GROQ_API_KEY="gsk_your_free_api_key_here"`
- [ ] Replace with your actual key
- [ ] Save file (Ctrl+S)

## 3️⃣ Restart Dev Server (1 minute)
- [ ] Stop current server (Ctrl+C in terminal)
- [ ] Run: `npm run dev`
- [ ] Wait for "ready on http://localhost:3000"

## 4️⃣ Test Chat (2 minutes)
- [ ] Open http://localhost:3000
- [ ] Click chat icon (bottom-right)
- [ ] Type: "Find me a hotel in Pokhara under 2000 NPR"
- [ ] Expected: Hotel recommendations (no subscription error)

## 5️⃣ Test Voice Search (2 minutes)
- [ ] Navigate to `/hotels` page
- [ ] Click microphone icon
- [ ] Say: "hotel in pokhara"
- [ ] Expected: Hotels load from voice search

## ✅ All Done!
If chat and voice work → You're ready to use the app!

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Chat shows "Get your FREE Groq API key..." | You forgot to add the key to `.env` — see step 2 above |
| Chat shows "Invalid Groq API key" | Key is wrong or expired — get a new one and update `.env` |
| Voice shows "Microphone access denied" | Click lock icon in browser → allow microphone access |
| Dev server won't start | Port 3000 busy → use `npm run dev -- -p 3001` |
| Any other error | Check browser console (F12) and terminal for error message |

---

## 📚 Full Guide
See `SETUP_AND_TESTING.md` for detailed instructions and advanced troubleshooting.
