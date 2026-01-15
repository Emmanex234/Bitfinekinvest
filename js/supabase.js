// Supabase Configuration
// Replace these with your actual Supabase project credentials

const SUPABASE_URL = 'https://vvbwmkmcjiaovbdlubof.supabase.co'; // e.g., 'https://xxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2Yndta21jamlhb3ZiZGx1Ym9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTMzMTQsImV4cCI6MjA4NDAyOTMxNH0.91RbKIrjQOU2GTJT_t9L74gWYoRp3pt1TngvUvevlHE';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database Schema (for reference - implement these tables in Supabase)
/*
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
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Investment Plans Table
CREATE TABLE investment_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    investment_id UUID REFERENCES investments(id),
    type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'profit'
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
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);
    
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Investments policies
CREATE POLICY "Users can view own investments" ON investments
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can create investments" ON investments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can create transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin policies (add after creating admin users)
CREATE POLICY "Admins can view all" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Insert default investment plans
INSERT INTO investment_plans (name, min_amount, max_amount, weekly_return, duration_weeks, requires_unlock) VALUES
    ('BASIC', 100, 1000, 5, 2, FALSE),
    ('PLATINUM', 1000, 5000, 5, 4, FALSE),
    ('GOLD', 5000, 50000, 10, 4, FALSE),
    ('EXPERT', 50000, 1000000, 15, 8, TRUE);
*/

// Company Crypto Wallet (Update with your actual wallet addresses)
const COMPANY_WALLETS = {
    BTC: {
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        network: 'Bitcoin'
    },
    ETH: {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        network: 'Ethereum (ERC-20)'
    },
    USDT: {
        address: 'TXYZopYRdj2D9XRtbG4uDJNXQqbdJ3JZ',
        network: 'Tron (TRC-20)'
    }
};

// Helper function to check authentication
async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
}

// Helper function to get current user profile
async function getCurrentUserProfile() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return null;
    
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (error) throw error;
    return data;
}

// Helper function to log actions
async function logAudit(action, details = {}) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;
    
    await supabaseClient.from('audit_logs').insert([{
        user_id: user.id,
        action: action,
        details: details,
        ip_address: await getUserIP(),
        user_agent: navigator.userAgent
    }]);
}

// Helper function to get user IP (simplified)
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'unknown';
    }
}