// Authentication and UI Helper Functions

// Show loading overlay
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.add('active');
}

// Hide loading overlay
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.remove('active');
}

// Show toast notification
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer') || document.body;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.success}</div>
        <div class="toast-message">${message}</div>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Format date with time
function formatDateTime(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Calculate investment returns
function calculateReturns(amount, weeklyRate, weeks) {
    const totalReturn = amount * (weeklyRate / 100) * weeks;
    return {
        principal: amount,
        totalReturn: totalReturn,
        finalAmount: amount + totalReturn,
        weeklyReturn: amount * (weeklyRate / 100)
    };
}

// Validate email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate crypto wallet address (basic validation)
function isValidWalletAddress(address) {
    // Bitcoin address
    if (/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(address)) return true;
    // Ethereum address
    if (/^0x[a-fA-F0-9]{40}$/.test(address)) return true;
    // Tron address
    if (/^T[a-zA-Z0-9]{33}$/.test(address)) return true;
    return false;
}

// Get status badge HTML
function getStatusBadge(status) {
    const badges = {
        pending: '<span class="status-badge pending">Pending</span>',
        approved: '<span class="status-badge approved">Approved</span>',
        rejected: '<span class="status-badge rejected">Rejected</span>',
        active: '<span class="status-badge active">Active</span>',
        completed: '<span class="status-badge approved">Completed</span>'
    };
    return badges[status.toLowerCase()] || `<span class="status-badge">${status}</span>`;
}

// Upload file to Supabase Storage
async function uploadFile(file, bucket, path) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${path}/${fileName}`;
    
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
    
    return publicUrl;
}

// Get user initials for avatar
function getUserInitials(name) {
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// Check if user is admin
async function isAdmin() {
    try {
        const profile = await getCurrentUserProfile();
        return profile && profile.role === 'admin';
    } catch (error) {
        return false;
    }
}

// Redirect if not authenticated
async function requireAuth() {
    const session = await checkAuth();
    if (!session) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Redirect if not admin
async function requireAdmin() {
    const session = await checkAuth();
    if (!session) {
        window.location.href = '../login.html';
        return false;
    }
    
    const admin = await isAdmin();
    if (!admin) {
        window.location.href = '../dashboard.html';
        return false;
    }
    
    return true;
}

// Logout function
async function logout() {
    try {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        showToast('Error logging out', 'error');
    }
}

// Show/Hide modal
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Copy to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!', 'success');
    } catch (error) {
        showToast('Failed to copy', 'error');
    }
}

// Sanitize input
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// Generate random verification code
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Check if investment plan is unlocked
async function isPlanUnlocked(planName, userId) {
    if (planName !== 'EXPERT') return true;
    
    // Check if user has completed GOLD plan
    const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .in('plan_id', 
            await supabase
                .from('investment_plans')
                .select('id')
                .eq('name', 'GOLD')
                .then(res => res.data.map(p => p.id))
        );
    
    return data && data.length > 0;
}

// Calculate days remaining
function daysRemaining(endDate) {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
}

// Get investment progress percentage
function getInvestmentProgress(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    const total = end - start;
    const elapsed = now - start;
    
    const percentage = (elapsed / total) * 100;
    return Math.min(Math.max(percentage, 0), 100);
}

// Real-time subscription helpers
function subscribeToUserData(userId, callback) {
    return supabase
        .channel('user-data')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
            callback
        )
        .subscribe();
}

function subscribeToInvestments(userId, callback) {
    return supabase
        .channel('investments')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'investments', filter: `user_id=eq.${userId}` },
            callback
        )
        .subscribe();
}

function subscribeToTransactions(userId, callback) {
    return supabase
        .channel('transactions')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
            callback
        )
        .subscribe();
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
    
    // Setup modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('active');
        });
    });
});