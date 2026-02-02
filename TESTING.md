# Testing & Verification Guide

## ✅ Code Changes Completed

All security fixes have been implemented and pushed to GitHub:

1. ✅ **Netlify Functions Created** - Two serverless functions for API security
2. ✅ **Response API Updated** - Fixed to use new `Response` format  
3. ✅ **JSON Parsing Fixed** - Strips markdown code blocks from Claude responses
4. ✅ **Daily Cost Limits** - $1/day limit implemented
5. ✅ **Security Headers** - Configured in netlify.toml

## 🧪 How to Test the Deployed App

### Option 1: Test on Netlify (Recommended)

1. **Check Deployment Status**:
   - Go to your Netlify dashboard
   - Find your site (FinDocAssistant)
   - Verify the latest commit is deployed (commit: "Fix: Strip markdown code blocks...")
   
2. **Visit Your Site**:
   - Click on your site URL (e.g., `https://your-site-name.netlify.app`)
   
3. **Test Document Upload**:
   - Upload a test invoice/receipt image
   - Verify extraction works
   - Check that no errors appear
   
4. **Verify Security**:
   - Open DevTools → Network tab
   - Upload a document
   - Confirm requests go to `/.netlify/functions/` (not to anthropic.com directly)
   - Verify API key is NOT visible in any request

### Option 2: Test Locally with Netlify Dev

If local testing is needed:

```powershell
# In PowerShell
cd C:\Users\sutri\Genaiproject\FinDocAssistant

# Make sure .env file has your API key
# ANTHROPIC_API_KEY=sk-ant-your-key-here

# Start the server
npm run dev:netlify

# Wait for message: "Local dev server ready: http://localhost:8888"
# Then open http://localhost:8888 in your browser
```

## ✅ What to Verify

### Functionality Tests
- [ ] App loads without errors
- [ ] Can upload an image (drag & drop or click)
- [ ] Processing starts and shows steps
- [ ] Extraction completes successfully
- [ ] Review page shows extracted data
- [ ] Can edit fields manually
- [ ] History saves processed documents

### Security Tests  
- [ ] API calls go through Netlify Functions (check Network tab)
- [ ] No API key visible in browser/network requests
- [ ] Cost tracking shows in response (dailyTotal, remainingBudget)
- [ ] HTTPS enforced (green padlock in address bar)

### Error Handling Tests
- [ ] Try uploading invalid file → Shows error message
- [ ] Try uploading very large file → Handles gracefully
- [ ] Check Netlify function logs for any errors

## 🐛 Troubleshooting

### If Extraction Fails

**Check Netlify Function Logs:**
1. Go to Netlify Dashboard → Your Site → Functions
2. Click on `claude-extract` function
3. View recent invocation logs
4. Look for error messages

**Common Issues:**
- **"API authentication failed"** → Check `ANTHROPIC_API_KEY` in Netlify env vars
- **"Daily limit reached"** → Reset tomorrow or increase limit in function code
- **JSON parsing error** → Should be fixed now, check latest deployment
- **500 error** → Check function logs for stack trace

### If App Won't Load Locally

```powershell
# Kill any existing processes
Get-Process node | Stop-Process -Force

# Clear node modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install

# Try again
npm run dev:netlify
```

## 📊 Expected Behavior

### Successful Extraction Response:
```json
{
  "success": true,
  "data": {
    "vendor_name": "Example Corp",
    "reference_number": "INV-12345",
    "transaction_date": "2026-02-01",
    "total_amount": "99.99",
    "currency": "USD",
    // ... more fields
  },
  "usage": {
    "inputTokens": 1234,
    "outputTokens": 456,
    "cost": 0.0234,
    "dailyTotal": 0.0234,
    "dailyLimit": 1.0,
    "remainingBudget": 0.9766
  }
}
```

### Cost Limit Reached Response:
```json
{
  "error": "Daily API cost limit reached",
  "message": "Daily limit of $1 has been reached. Please try again tomorrow.",
  "errorType": "rate_limit_error",
  "dailyLimit": 1.0,
  "currentUsage": 1.02
}
```

## ✅ Deployment Checklist

Before declaring done, verify:

- [ ] Latest code pushed to GitHub
- [ ] Netlify deployment succeeded (check dashboard)
- [ ] Environment variable `ANTHROPIC_API_KEY` is set in Netlify
- [ ] Test document upload works end-to-end
- [ ] Network tab shows Netlify Functions being called
- [ ] No console errors in browser
- [ ] Cost tracking is working (check response includes usage data)
- [ ] Security headers present (check with DevTools or securityheaders.com)

## 🎉 When Everything Works

You should see:
1. ✅ App loads at your Netlify URL
2. ✅ Document upload and processing completes
3. ✅ Extracted data displays correctly
4. ✅ No API key exposure (checked in Network tab)
5. ✅ Cost tracking shows in responses
6. ✅ All security headers configured

**Then you can confidently declare: The app is production-ready and secure! 🚀**

## 📝 Next Steps After Verification

1. Share your Netlify URL
2. Monitor costs in Anthropic Console
3. Check Netlify function logs periodically
4. Set up Anthropic billing alerts
5. Consider custom domain (optional)
