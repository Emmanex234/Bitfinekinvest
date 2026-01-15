# 🚀 QUICK SETUP GUIDE - Bitfinekinvest

## Step 1: Supabase Setup (5 minutes)

1. Go to https://supabase.com and create account
2. Click "New Project"
3. Name it "bitfinekinvest" 
4. Choose a strong database password
5. Wait 2 minutes for project creation

## Step 2: Database Setup

1. In Supabase, click **SQL Editor**
2. Copy ALL the SQL from `README.md` (the big SQL block)
3. Paste into SQL Editor
4. Click **Run**
5. Wait for "Success" message

## Step 3: Storage Setup

1. Click **Storage** in Supabase sidebar
2. Click **New Bucket**
3. Name: `proofs`
4. Make it **Public**
5. Click **Create**

## Step 4: Get Your Credentials

1. Click **Settings** → **API**
2. Copy **Project URL**
3. Copy **anon public key**

## Step 5: Configure Website

1. Open `js/supabase.js` in a text editor
2. Find these lines:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
3. Replace with YOUR values from Step 4
4. Save the file

## Step 6: Update Wallet Addresses

Still in `js/supabase.js`, find:
```javascript
const COMPANY_WALLETS = {
    BTC: {
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        network: 'Bitcoin'
    },
    // ...
};
```

Replace with YOUR actual crypto wallet addresses!

## Step 7: Test Locally

1. Open `index.html` in your browser
2. Click "Get Started"
3. Register a test account
4. Check browser console for verification code (since email isn't setup yet)

## Step 8: Create Admin Account

1. Register an account through the website
2. Go to Supabase **SQL Editor**
3. Run this (replace with your email):
   ```sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE email = 'youremail@example.com';
   ```
4. Now you can access `/admin/dashboard.html`

## Step 9: Deploy (Choose One)

### Option A: Netlify (Easiest)
1. Go to https://netlify.com
2. Drag and drop the entire `bitfinekinvest` folder
3. Done! Your site is live

### Option B: Vercel
1. Go to https://vercel.com
2. Import project
3. Deploy

### Option C: GitHub Pages
1. Create GitHub repo
2. Push all files
3. Enable Pages in Settings
4. Choose main branch

## Step 10: Setup Email (Optional but Recommended)

Currently verification codes print to console. For production:

1. Sign up for SendGrid/Mailgun/AWS SES
2. Get API key
3. Edit `register.html` → `sendVerificationEmail` function
4. Add actual email sending code

Example for SendGrid:
```javascript
async function sendVerificationEmail(email, code, name) {
    await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer YOUR_SENDGRID_KEY',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            personalizations: [{
                to: [{ email: email }]
            }],
            from: { email: 'noreply@yoursite.com' },
            subject: 'Verify Your Email',
            content: [{
                type: 'text/plain',
                value: `Your code: ${code}`
            }]
        })
    });
}
```

## ✅ You're Done!

Your crypto investment platform is now:
- ✅ Live and functional
- ✅ Secured with Supabase
- ✅ Professional looking
- ✅ Mobile responsive
- ✅ Ready for users

## 🎯 Next Steps

1. **Test Everything**: Register, invest, withdraw
2. **Customize**: Change colors, text, branding
3. **Add Domain**: Point your domain to hosting
4. **SSL**: Enable HTTPS (usually automatic)
5. **Legal**: Add proper terms, privacy policy
6. **Marketing**: Start promoting!

## 🆘 Common Issues

**Can't login?**
- Check Supabase credentials in `js/supabase.js`
- Check browser console for errors

**Database errors?**
- Make sure ALL SQL ran successfully
- Check RLS policies are enabled

**Images not uploading?**
- Create `proofs` bucket in Supabase Storage
- Make sure it's public

**Admin page not working?**
- Make sure you updated user role to 'admin'
- Check `profiles` table in Supabase

## 📞 Need Help?

Check:
1. Browser DevTools Console (F12)
2. Supabase Logs
3. Network tab for failed requests

---

**Remember**: This is a REAL investment platform. Handle with care, follow laws, and prioritize security!