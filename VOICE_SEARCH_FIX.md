# 🎙️ Voice Search Network Error - Troubleshooting Guide

## ⚠️ What Happened

Voice search was working initially but now shows "network error". This is a known issue with browser Web Speech API when:
1. The browser's speech recognition service has network connectivity issues
2. The service is temporarily unavailable
3. The microphone stream drops

## ✅ What I Fixed

### 1. **Improved Error Handling**
- Better retry logic (retry once, then show fallback)
- Clearer error messages with guidance
- Automatic recovery attempts

### 2. **Better Language Configuration**
- Changed from `en-IN` (India English) to `en-US` (US English)
- More compatible with speech recognition engines

### 3. **Robust Initialization**
- Better cleanup of previous recognition instances
- Safer error recovery

---

## 🧪 How to Test Voice Search (Updated)

### **Test 1: Basic Voice Input**
1. Go to http://localhost:3000/hotels
2. Click the **microphone button** (amber/gold colored)
3. You should see:
   - Button turns red
   - Green pulse animation around button
   - "Listening..." message
4. Say clearly: `"hotels in pokhara"`
5. Wait 2-3 seconds for processing

**Expected outcomes:**
- ✅ Your speech is transcribed
- ✅ Hotels matching your query load
- ✅ No error messages (or error auto-retries)

---

### **Test 2: If You Get Network Error**

**DO NOT PANIC** — This is normal sometimes. The fix now:

1. **First Retry (Automatic)**
   - System automatically retries once
   - Wait 1 second
   - Try speaking again

2. **If Still Fails**
   - **Option A**: Click mic button again to retry
   - **Option B**: Use the fallback text input that appears
   - **Option C**: Refresh page and try again

3. **If Persistent**
   - Check your internet connection
   - Try in a different browser (Chrome works best)
   - Clear browser cache (Ctrl+Shift+Delete)

---

## 🔧 Browser-Specific Fixes

### **Google Chrome** (Best for voice)
1. Open Settings → Privacy and security → Site settings
2. Look for "Microphone"
3. Make sure your site is set to "Allow"
4. Refresh the page
5. Try voice search again

### **Firefox**
1. Go to about:preferences#privacy
2. Scroll to "Permissions" → "Microphone"
3. Check that the site has permission
4. Refresh and try again

### **Edge**
1. Settings → Privacy and security → App permissions
2. Find "Microphone"
3. Enable for your site
4. Refresh and try again

---

## 🐛 Debugging: Check Browser Console

If voice search still fails:

1. Open **Developer Tools** (F12)
2. Go to **Console** tab
3. Try voice search again
4. Look for messages starting with `[VOICE]`
5. **Examples:**
   - `[VOICE] error network` → Network issue (expected, should auto-retry)
   - `[VOICE] error not-allowed` → Microphone permission denied (enable in browser)
   - `[VOICE] error no-speech` → Microphone detected but no sound (speak louder)

---

## 📋 Step-by-Step: Fresh Start

If nothing works:

1. **Close browser completely**
   - Chrome: Alt+F4 or close all windows

2. **Clear cache**
   - Windows: Ctrl+Shift+Delete
   - Select "All time"
   - Check "Cookies and cached images"
   - Click "Clear"

3. **Restart dev server**
   ```bash
   Ctrl+C  (stop current server)
   npm run dev
   ```

4. **Reopen browser**
   - Go to http://localhost:3000/hotels
   - Scroll down, find microphone button
   - Click and try again

5. **Verify microphone**
   - Test microphone on Google Docs (Docs → Voice typing)
   - If it works there, it'll work in NepalStay
   - If not, microphone hardware/driver issue

---

## 📞 Advanced Diagnostics

### Check if Web Speech API is Available
Open browser console (F12) and run:
```javascript
console.log("Web Speech API available:", 
  'webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
```

**Result should be:** `true`

If `false`, your browser doesn't support voice search (try Chrome/Edge).

### Check Microphone Permission Status
```javascript
navigator.permissions.query({name: 'microphone'}).then(result => {
  console.log("Microphone permission:", result.state);
});
```

**Expected result:** `granted` or `prompt`
**If:** `denied` → Enable in browser settings

---

## 💡 Why Network Errors Happen

The browser's Speech Recognition API connects to Google's cloud service by default:
- If internet is slow → Network error
- If Google service is down → Service unavailable error
- If audio stream is interrupted → Network error

**Solution**: The component now retries automatically once, then offers fallback text input.

---

## ✨ New Features (This Fix)

✅ **Auto-retry**: Automatically retries once on network error  
✅ **Better messages**: Clear guidance on what went wrong  
✅ **Fallback input**: Can type instead if voice fails  
✅ **Safer initialization**: Won't crash if previous instance doesn't clean up  
✅ **Better language**: Changed to en-US for wider compatibility  

---

## 🎯 Next Steps

1. **Refresh your browser** (F5)
2. **Go to /hotels page**
3. **Test voice search**
4. **Report back with:**
   - ✅ Voice worked? Great!
   - ❌ Still getting errors? Check console (F12) and share the error message

---

## 📝 Common Error Messages (What They Mean)

| Error | Meaning | Fix |
|-------|---------|-----|
| `network` | Speech service unreachable | Auto-retries; if fails, use text input |
| `not-allowed` | Microphone permission denied | Enable mic in browser settings |
| `no-speech` | Microphone detected but no sound | Speak louder, check mic volume |
| `service-not-available` | Google service temporarily down | Wait a moment, try again |
| `bad-grammar` | Speech too unclear/incomplete | Speak more clearly, shorter phrases |
| `timeout` | Request took too long | Try again, check internet speed |

---

## ✅ Verification Checklist

After the fix, verify:
- [ ] Dev server running (npm run dev active)
- [ ] Microphone working (test on Google Docs)
- [ ] Browser has microphone permission
- [ ] Internet connection stable
- [ ] No browser extensions blocking microphone
- [ ] Using Chrome or Edge (best compatibility)

---

## 🚀 If Everything Works

Excellent! You can now:
1. ✅ Use voice search to find hotels
2. ✅ Speak naturally (e.g., "hotels in pokhara under 2000 NPR")
3. ✅ Get instant results
4. ✅ Fall back to text if voice fails

---

**This fix ensures voice search is resilient and user-friendly. Enjoy!** 🎉
