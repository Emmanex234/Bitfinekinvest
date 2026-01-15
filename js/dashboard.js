// Dashboard functionality
let currentUser = null;
let currentProfile = null;
let investmentPlans = [];
let userInvestments = [];
let userTransactions = [];

// Initialize dashboard
(async () => {
    const authed = await requireAuth();
    if (!authed) return;
    
    try {
        showLoading();
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        currentUser = user;
        
        // Get profile
        currentProfile = await getCurrentUserProfile();
        
        // Check if profile is complete
        if (!currentProfile.profile_completed) {
            window.location.href = 'complete-profile.html';
            return;
        }
        
        // Load data
        await loadUserData();
        await loadInvestmentPlans();
        await loadUserInvestments();
        await loadUserTransactions();
        
        // Update UI
        updateDashboard();
        
        // Setup real-time subscriptions
        setupSubscriptions();
        
        hideLoading();
        
    } catch (error) {
        hideLoading();
        showToast('Error loading dashboard: ' + error.message, 'error');
    }
})();

// Load user data
async function loadUserData() {
    document.getElementById('userName').textContent = currentProfile.full_name;
    document.getElementById('welcomeName').textContent = currentProfile.full_name.split(' ')[0];
    document.getElementById('userAvatar').textContent = getUserInitials(currentProfile.full_name);
}

// Load investment plans
async function loadInvestmentPlans() {
    const { data, error } = await supabase
        .from('investment_plans')
        .select('*')
        .eq('status', 'active')
        .order('min_amount', { ascending: true });
    
    if (error) throw error;
    investmentPlans = data;
    renderInvestmentPlans();
}

// Render investment plans
function renderInvestmentPlans() {
    const plansGrid = document.getElementById('plansGrid');
    
    if (investmentPlans.length === 0) {
        plansGrid.innerHTML = '<p style="text-align: center; padding: 2rem;">No plans available</p>';
        return;
    }
    
    plansGrid.innerHTML = investmentPlans.map(plan => {
        const isLocked = plan.requires_unlock && !checkPlanUnlocked(plan.name);
        const returns = calculateReturns(plan.min_amount, plan.weekly_return, plan.duration_weeks);
        
        return `
            <div class="plan-card ${plan.name === 'GOLD' ? 'gold-plan' : ''} ${isLocked ? 'locked' : ''}">
                <h3 class="plan-name">${plan.name}</h3>
                <div class="plan-range">${formatCurrency(plan.min_amount)} - ${formatCurrency(plan.max_amount)}</div>
                <div class="plan-details">
                    <div class="plan-detail">
                        <span class="plan-detail-label">Weekly Return</span>
                        <span class="plan-detail-value">${plan.weekly_return}%</span>
                    </div>
                    <div class="plan-detail">
                        <span class="plan-detail-label">Duration</span>
                        <span class="plan-detail-value">${plan.duration_weeks} weeks</span>
                    </div>
                    <div class="plan-detail">
                        <span class="plan-detail-label">Min. Investment</span>
                        <span class="plan-detail-value">${formatCurrency(plan.min_amount)}</span>
                    </div>
                </div>
                ${isLocked ? 
                    '<p style="color: var(--warning); font-size: 0.9rem; margin-top: 1rem;">Complete GOLD plan to unlock</p>' :
                    `<button class="btn btn-gold" style="width: 100%; margin-top: 1rem;" onclick="selectPlan('${plan.id}', '${plan.name}', ${plan.min_amount}, ${plan.max_amount})">
                        Invest Now
                    </button>`
                }
            </div>
        `;
    }).join('');
}

// Check if plan is unlocked
function checkPlanUnlocked(planName) {
    if (planName !== 'EXPERT') return true;
    
    // Check if user has completed GOLD plan
    return userInvestments.some(inv => 
        inv.plan_name === 'GOLD' && 
        inv.status === 'completed'
    );
}

// Select investment plan
function selectPlan(planId, planName, minAmount, maxAmount) {
    document.getElementById('selectedPlanId').value = planId;
    document.getElementById('depositAmount').min = minAmount;
    document.getElementById('depositAmount').max = maxAmount;
    document.getElementById('depositAmount').placeholder = `${formatCurrency(minAmount)} - ${formatCurrency(maxAmount)}`;
    
    hideModal('plansModal');
    showModal('depositModal');
}

// Handle crypto selection
document.getElementById('cryptoType')?.addEventListener('change', (e) => {
    const crypto = e.target.value;
    if (!crypto) {
        document.getElementById('walletInfo').style.display = 'none';
        return;
    }
    
    const wallet = COMPANY_WALLETS[crypto];
    document.getElementById('cryptoNetwork').textContent = wallet.network;
    document.getElementById('walletAddressDisplay').value = wallet.address;
    document.getElementById('walletInfo').style.display = 'block';
});

// Copy wallet address
function copyWalletAddress() {
    const address = document.getElementById('walletAddressDisplay').value;
    copyToClipboard(address);
}

// Handle deposit form submission
document.getElementById('depositForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const planId = document.getElementById('selectedPlanId').value;
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const cryptoType = document.getElementById('cryptoType').value;
    const txHash = document.getElementById('txHash').value.trim();
    const proofFile = document.getElementById('proofFile').files[0];
    
    if (!proofFile) {
        showToast('Please upload proof of payment', 'error');
        return;
    }
    
    showLoading();
    
    try {
        // Upload proof of payment
        const proofUrl = await uploadFile(proofFile, 'proofs', `deposits/${currentUser.id}`);
        
        // Create investment record
        const { data: investment, error } = await supabase
            .from('investments')
            .insert([{
                user_id: currentUser.id,
                plan_id: planId,
                amount: amount,
                status: 'pending',
                proof_of_payment: proofUrl,
                transaction_hash: txHash || null
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        // Create transaction record
        await supabase
            .from('transactions')
            .insert([{
                user_id: currentUser.id,
                investment_id: investment.id,
                type: 'deposit',
                amount: amount,
                status: 'pending',
                proof_of_payment: proofUrl,
                transaction_hash: txHash || null,
                network: document.getElementById('cryptoNetwork').textContent
            }]);
        
        // Log audit
        await logAudit('deposit_submitted', {
            investment_id: investment.id,
            amount: amount,
            plan_id: planId
        });
        
        hideLoading();
        hideModal('depositModal');
        showToast('Deposit submitted successfully! Awaiting admin approval.', 'success');
        
        // Reset form
        document.getElementById('depositForm').reset();
        document.getElementById('walletInfo').style.display = 'none';
        
        // Reload data
        await loadUserInvestments();
        await loadUserTransactions();
        updateDashboard();
        
    } catch (error) {
        hideLoading();
        showToast('Error submitting deposit: ' + error.message, 'error');
    }
});

// Load user investments
async function loadUserInvestments() {
    const { data, error } = await supabase
        .from('investments')
        .select(`
            *,
            plan:investment_plans(name, weekly_return, duration_weeks)
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    userInvestments = data.map(inv => ({
        ...inv,
        plan_name: inv.plan?.name
    }));
    
    renderInvestments();
}

// Render investments table
function renderInvestments() {
    const table = document.getElementById('investmentsTable');
    
    if (userInvestments.length === 0) {
        table.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--accent-blue);">No investments yet. Start by selecting a plan!</p>';
        return;
    }
    
    table.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Progress</th>
                    <th>Returns</th>
                </tr>
            </thead>
            <tbody>
                ${userInvestments.map(inv => `
                    <tr>
                        <td><strong>${inv.plan_name}</strong></td>
                        <td>${formatCurrency(inv.amount)}</td>
                        <td>${getStatusBadge(inv.status)}</td>
                        <td>${inv.start_date ? formatDate(inv.start_date) : '-'}</td>
                        <td>${inv.end_date ? formatDate(inv.end_date) : '-'}</td>
                        <td>
                            ${inv.status === 'active' && inv.start_date && inv.end_date ? 
                                `<div style="background: var(--gray); border-radius: 10px; height: 8px; overflow: hidden;">
                                    <div style="background: var(--gold); height: 100%; width: ${getInvestmentProgress(inv.start_date, inv.end_date)}%; transition: width 0.3s;"></div>
                                </div>` 
                                : '-'
                            }
                        </td>
                        <td><strong style="color: var(--success);">${formatCurrency(inv.total_return || 0)}</strong></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Load user transactions
async function loadUserTransactions() {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(10);
    
    if (error) throw error;
    userTransactions = data;
    renderTransactions();
}

// Render transactions table
function renderTransactions() {
    const table = document.getElementById('transactionsTable');
    
    if (userTransactions.length === 0) {
        table.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--accent-blue);">No transactions yet</p>';
        return;
    }
    
    table.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Details</th>
                </tr>
            </thead>
            <tbody>
                ${userTransactions.map(tx => `
                    <tr>
                        <td><strong style="text-transform: capitalize;">${tx.type}</strong></td>
                        <td>${formatCurrency(tx.amount)}</td>
                        <td>${getStatusBadge(tx.status)}</td>
                        <td>${formatDateTime(tx.created_at)}</td>
                        <td>
                            ${tx.transaction_hash ? 
                                `<a href="#" style="color: var(--light-blue);" onclick="alert('TX: ${tx.transaction_hash}'); return false;">View TX</a>` 
                                : '-'
                            }
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Update dashboard stats
function updateDashboard() {
    // Calculate total balance (approved + active returns)
    const totalBalance = userInvestments
        .filter(inv => inv.status === 'active' || inv.status === 'completed')
        .reduce((sum, inv) => sum + (inv.amount + (inv.total_return || 0)), 0);
    
    // Active investments count
    const activeCount = userInvestments.filter(inv => inv.status === 'active').length;
    
    // Total profit
    const totalProfit = userInvestments
        .reduce((sum, inv) => sum + (inv.total_return || 0), 0);
    
    // Pending count
    const pendingCount = [...userInvestments, ...userTransactions]
        .filter(item => item.status === 'pending').length;
    
    // Update UI
    document.getElementById('totalBalance').textContent = formatCurrency(totalBalance);
    document.getElementById('activeInvestments').textContent = activeCount;
    document.getElementById('totalProfit').textContent = formatCurrency(totalProfit);
    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('availableBalance').textContent = formatCurrency(totalBalance);
    document.getElementById('withdrawWallet').value = currentProfile.crypto_wallet_address;
}

// Handle withdrawal form
document.getElementById('withdrawForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    
    // Get available balance
    const totalBalance = userInvestments
        .filter(inv => inv.status === 'active' || inv.status === 'completed')
        .reduce((sum, inv) => sum + (inv.amount + (inv.total_return || 0)), 0);
    
    if (amount > totalBalance) {
        showToast('Insufficient balance', 'error');
        return;
    }
    
    if (amount < 10) {
        showToast('Minimum withdrawal is $10', 'error');
        return;
    }
    
    showLoading();
    
    try {
        // Create withdrawal transaction
        await supabase
            .from('transactions')
            .insert([{
                user_id: currentUser.id,
                type: 'withdrawal',
                amount: amount,
                status: 'pending',
                crypto_wallet: currentProfile.crypto_wallet_address
            }]);
        
        // Log audit
        await logAudit('withdrawal_requested', { amount: amount });
        
        hideLoading();
        hideModal('withdrawModal');
        showToast('Withdrawal request submitted! Awaiting admin approval.', 'success');
        
        // Reset form
        document.getElementById('withdrawForm').reset();
        
        // Reload data
        await loadUserTransactions();
        updateDashboard();
        
    } catch (error) {
        hideLoading();
        showToast('Error submitting withdrawal: ' + error.message, 'error');
    }
});

// Setup real-time subscriptions
function setupSubscriptions() {
    // Subscribe to investments changes
    subscribeToInvestments(currentUser.id, async (payload) => {
        await loadUserInvestments();
        updateDashboard();
        
        if (payload.eventType === 'UPDATE' && payload.new.status === 'approved') {
            showToast('Investment approved!', 'success');
        }
    });
    
    // Subscribe to transactions changes
    subscribeToTransactions(currentUser.id, async (payload) => {
        await loadUserTransactions();
        updateDashboard();
        
        if (payload.eventType === 'UPDATE' && payload.new.status === 'approved') {
            showToast('Transaction approved!', 'success');
        }
    });
}