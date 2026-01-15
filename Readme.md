# Bitfinekinvest - Professional Crypto Investment Platform

A secure, professional crypto investment platform built with HTML, Tailwind CSS, JavaScript, and Supabase.

## 🎨 Design Features

- **Blue & White Theme with Gold Accents**: Professional color scheme
- **Smooth Animations**: Professional animations and transitions
- **Fully Responsive**: Works seamlessly on mobile and desktop
- **Modern Typography**: Playfair Display + Work Sans font combination
- **Clean UI**: Professional, trustworthy interface

## ✨ Key Features

### User Features
- ✅ Email verification with 6-digit code
- ✅ Complete profile setup (DOB, Address, Wallet)
- ✅ Professional dashboard with real-time stats
- ✅ Investment plans (Basic, Platinum, Gold, Expert)
- ✅ Crypto-only deposits with proof of payment
- ✅ Withdrawal requests
- ✅ Transaction history
- ✅ Real-time updates

### Admin Features
- ✅ User management
- ✅ Manual deposit verification
- ✅ Manual withdrawal approval
- ✅ Investment monitoring
- ✅ Transaction oversight
- ✅ Audit logs
- ✅ User blocking capability

### Security Features
- ✅ Email verification required
- ✅ Manual transaction approval
- ✅ Role-based access control
- ✅ Audit logging
- ✅ Profile completion enforcement
- ✅ No automated crypto transfers

## 🛠️ Tech Stack

- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Fonts**: Google Fonts (Playfair Display, Work Sans)
- **Icons**: Unicode emojis for simplicity

## 📁 Project Structure

```
bitfinekinvest/
├── index.html                 # Landing page (no investment plans)
├── register.html              # User registration
├── login.html                 # User login
├── verify.html                # Email verification
├── complete-profile.html      # Profile completion
├── dashboard.html             # User dashboard (investment plans inside)
├── css/
│   └── styles.css            # All styles
├── js/
│   ├── supabase.js           # Supabase configuration
│   ├── auth.js               # Authentication & helpers
│   ├── dashboard.js          # Dashboard functionality
│   └── admin.js              # Admin functionality
└── admin/
    └── dashboard.html        # Admin panel
```

## 🚀 Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be ready
3. Note down your project URL and anon key

### 2. Setup Database Schema

Run the following SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles Table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    country TEXT NOT NULL,
    date_of_birth DATE,
    address TEXT,
    crypto_wallet_address TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    profile_completed BOOLEAN DEFAULT FALSE,
    role TEXT DEFAULT 'user',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Email Verifications Table
CREATE TABLE email_verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Investment Plans Table
CREATE TABLE investment_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    min_amount DECIMAL NOT NULL,
    max_amount DECIMAL NOT NULL,
    weekly_return DECIMAL NOT NULL,
    duration_weeks INTEGER NOT NULL,
    requires_unlock BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Investments Table
CREATE TABLE investments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    plan_id UUID REFERENCES investment_plans(id),
    amount DECIMAL NOT NULL,
    status TEXT DEFAULT 'pending',
    proof_of_payment TEXT,
    transaction_hash TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    total_return DECIMAL DEFAULT 0,
    withdrawn BOOLEAN DEFAULT FALSE,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    investment_id UUID REFERENCES investments(id),
    type TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    status TEXT DEFAULT 'pending',
    proof_of_payment TEXT,
    transaction_hash TEXT,
    crypto_wallet TEXT,
    network TEXT,
    admin_notes TEXT,
    processed_by UUID REFERENCES profiles(id),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Logs Table
CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);
    
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Investments RLS Policies
CREATE POLICY "Users can view own investments" ON investments
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can create investments" ON investments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Transactions RLS Policies
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can create transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin Policies
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can view all investments" ON investments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can view all transactions" ON transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Insert Investment Plans
INSERT INTO investment_plans (name, min_amount, max_amount, weekly_return, duration_weeks, requires_unlock) VALUES
    ('BASIC', 100, 1000, 5, 2, FALSE),
    ('PLATINUM', 1000, 5000, 5, 4, FALSE),
    ('GOLD', 5000, 50000, 10, 4, FALSE),
    ('EXPERT', 50000, 1000000, 15, 8, TRUE);
```

### 3. Setup Storage Bucket

1. Go to Storage in Supabase
2. Create a new bucket called `proofs`
3. Make it public or set appropriate policies

### 4. Configure Application

1. Open `js/supabase.js`
2. Replace the placeholders:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
3. Update company wallet addresses:
   ```javascript
   const COMPANY_WALLETS = {
       BTC: {
           address: 'YOUR_BTC_ADDRESS',
           network: 'Bitcoin'
       },
       // ... update others
   };
   ```

### 5. Create Admin User

After setup, create your first admin user:

1. Register a normal account
2. In Supabase SQL Editor, run:
   ```sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE email = 'your-admin@email.com';
   ```

### 6. Deploy

You can deploy to:
- **Netlify**: Drag and drop the folder
- **Vercel**: Connect your Git repository
- **GitHub Pages**: Push to GitHub and enable Pages
- **Any static hosting**: Upload all files

## 🔧 Configuration

### Email Service Integration

The platform currently logs verification codes to console. To integrate a real email service:

1. Open `register.html`
2. Find the `sendVerificationEmail` function
3. Integrate your preferred service:
   - SendGrid
   - AWS SES
   - Mailgun
   - Resend

Example with SendGrid:
```javascript
async function sendVerificationEmail(email, code, name) {
    await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer YOUR_SENDGRID_API_KEY',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            personalizations: [{
                to: [{ email: email }],
                subject: 'Verify Your Email - Bitfinekinvest'
            }],
            from: { email: 'noreply@bitfinekinvest.com' },
            content: [{
                type: 'text/html',
                value: `<p>Your verification code is: <strong>${code}</strong></p>`
            }]
        })
    });
}
```

### Company Wallet Addresses

Update in `js/supabase.js`:
```javascript
const COMPANY_WALLETS = {
    BTC: {
        address: 'your_bitcoin_address',
        network: 'Bitcoin'
    },
    ETH: {
        address: 'your_ethereum_address',
        network: 'Ethereum (ERC-20)'
    },
    USDT: {
        address: 'your_tron_address',
        network: 'Tron (TRC-20)'
    }
};
```

## 📱 Usage Flow

### User Journey
1. **Register** → Email verification
2. **Verify Email** → 6-digit code
3. **Complete Profile** → DOB, Address, Wallet
4. **Dashboard** → View stats
5. **Select Plan** → Click "Investment Plans" button
6. **Deposit** → Upload proof, wait for approval
7. **Track Investment** → Real-time progress
8. **Request Withdrawal** → Admin processes manually

### Admin Journey
1. **Login** with admin account
2. **Review Deposits** → Verify blockchain, approve/reject
3. **Process Withdrawals** → Send crypto manually, mark as sent
4. **Monitor Users** → View profiles, block if needed
5. **Track All Activity** → Complete oversight

## 🔒 Security Best Practices

- ✅ Never store private keys in code
- ✅ Always verify transactions on blockchain
- ✅ Use environment variables for sensitive data
- ✅ Enable HTTPS on production
- ✅ Implement rate limiting (via Supabase)
- ✅ Regular security audits
- ✅ Keep Supabase RLS policies updated

## ⚠️ Legal Disclaimers

This platform includes:
- Risk disclaimers on landing page
- Terms & conditions checkbox
- No guaranteed returns promises
- Manual verification for all transactions

**Important**: Ensure compliance with your local regulations regarding:
- Investment platforms
- Cryptocurrency operations
- KYC/AML requirements
- Financial services licensing

## 🤝 Support

For issues or questions:
1. Check Supabase logs
2. Review browser console
3. Verify database policies
4. Check authentication state

## 📄 License

This is a proprietary template. Customize as needed for your business.

---

**Built according to specifications:**
- ✅ No investment plans on homepage
- ✅ Plans only in dashboard
- ✅ Blue/White/Gold color scheme
- ✅ Crypto-only platform
- ✅ Manual verification required
- ✅ Professional & trustworthy design