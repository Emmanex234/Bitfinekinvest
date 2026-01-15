// Admin Dashboard Functionality
let allUsers = [];
let pendingDeposits = [];
let pendingWithdrawals = [];
let allInvestments = [];
let allTransactions = [];
let currentItem = null;

// Initialize admin dashboard
(async () => {
    const authed = await requireAdmin();
    if (!authed) return;
    
    try {
        showLoading();
        await loadAllData();
        hideLoading();
    } catch (error) {
        hideLoading();
        showToast('Error loading admin data: ' + error.message, 'error');
    }
})();

// Load all data
async function loadAllData() {
    await Promise.all([
        loadUsers(),
        loadPendingDeposits(),
        loadPendingWithdrawals(),
        loadAllInvestments(),
        loadAllTransactions()
    ]);
}

// Tab switching
function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');
}

// Load all users
async function loadUsers() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    allUsers = data;
    renderUsers();
}

// Render users table
function renderUsers() {
    const table = document.getElementById('usersTable');
    
    if (allUsers.length === 0) {
        table.innerHTML = '<p style="text-align: center; padding: 2rem;">No users found</p>';
        return;
    }
    
    table.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Country</th>
                    <th>Status</th>
                    <th>Verified</th>
                    <th>Joined</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${allUsers.map(user => `
                    <tr>
                        <td><strong>${user.full_name}</strong></td>
                        <td>${user.email}</td>
                        <td>${user.country}</td>
                        <td>${getStatusBadge(user.status || 'active')}</td>
                        <td>${user.email_verified ? '✓' : '✗'}</td>
                        <td>${formatDate(user.created_at)}</td>
                        <td>
                            <button class="btn btn-outline action-btn" onclick="viewUser('${user.id}')">View</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// View user details
async function viewUser(userId) {
    showLoading();
    
    try {
        const { data: user, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        
        // Get user investments
        const { data: investments } = await supabase
            .from('investments')
            .select('*, plan:investment_plans(name)')
            .eq('user_id', userId);
        
        // Get user transactions
        const { data: transactions } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5);
        
        const totalInvested = investments?.reduce((sum, inv) => sum + parseFloat(inv.amount), 0) || 0;
        const activeInvestments = investments?.filter(inv => inv.status === 'active').length || 0;
        
        document.getElementById('userDetails').innerHTML = `
            <div style="display: grid; gap: 1.5rem;">
                <div>
                    <h4 style="color: var(--primary-blue); margin-bottom: 0.5rem;">Personal Information</h4>
                    <div style="display: grid; gap: 0.75rem; background: var(--gray); padding: 1.5rem; border-radius: 8px;">
                        <div><strong>Full Name:</strong> ${user.full_name}</div>
                        <div><strong>Email:</strong> ${user.email}</div>
                        <div><strong>Phone:</strong> ${user.phone}</div>
                        <div><strong>Country:</strong> ${user.country}</div>
                        <div><strong>Date of Birth:</strong> ${user.date_of_birth || 'Not provided'}</div>
                        <div><strong>Address:</strong> ${user.address || 'Not provided'}</div>
                    </div>
                </div>
                
                <div>
                    <h4 style="color: var(--primary-blue); margin-bottom: 0.5rem;">Crypto Wallet</h4>
                    <div style="background: var(--gray); padding: 1.5rem; border-radius: 8px;">
                        <div style="word-break: break-all;">${user.crypto_wallet_address || 'Not provided'}</div>
                    </div>
                </div>
                
                <div>
                    <h4 style="color: var(--primary-blue); margin-bottom: 0.5rem;">Account Statistics</h4>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                        <div style="background: var(--gray); padding: 1rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-blue);">${formatCurrency(totalInvested)}</div>
                            <div style="font-size: 0.85rem; color: var(--accent-blue);">Total Invested</div>
                        </div>
                        <div style="background: var(--gray); padding: 1rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-blue);">${activeInvestments}</div>
                            <div style="font-size: 0.85rem; color: var(--accent-blue);">Active Investments</div>
                        </div>
                        <div style="background: var(--gray); padding: 1rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-blue);">${investments?.length || 0}</div>
                            <div style="font-size: 0.85rem; color: var(--accent-blue);">Total Investments</div>
                        </div>
                    </div>
                </div>
                
                ${transactions && transactions.length > 0 ? `
                    <div>
                        <h4 style="color: var(--primary-blue); margin-bottom: 0.5rem;">Recent Transactions</h4>
                        <div style="background: var(--gray); padding: 1rem; border-radius: 8px;">
                            ${transactions.map(tx => `
                                <div style="padding: 0.75rem 0; border-bottom: 1px solid white;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <strong style="text-transform: capitalize;">${tx.type}</strong>
                                            <span style="margin-left: 1rem;">${formatCurrency(tx.amount)}</span>
                                        </div>
                                        <div>${getStatusBadge(tx.status)}</div>
                                    </div>
                                    <div style="font-size: 0.85rem; color: var(--accent-blue); margin-top: 0.25rem;">
                                        ${formatDateTime(tx.created_at)}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        currentItem = user;
        
        // Setup block button
        document.getElementById('blockUserBtn').onclick = () => blockUser(userId, user.status !== 'blocked');
        
        hideLoading();
        showModal('userModal');
        
    } catch (error) {
        hideLoading();
        showToast('Error loading user details: ' + error.message, 'error');
    }
}

// Block/Unblock user
async function blockUser(userId, shouldBlock) {
    if (!confirm(shouldBlock ? 'Block this user?' : 'Unblock this user?')) return;
    
    showLoading();
    
    try {
        await supabase
            .from('profiles')
            .update({ status: shouldBlock ? 'blocked' : 'active' })
            .eq('id', userId);
        
        await logAudit(shouldBlock ? 'user_blocked' : 'user_unblocked', { user_id: userId });
        
        hideLoading();
        hideModal('userModal');
        showToast(`User ${shouldBlock ? 'blocked' : 'unblocked'} successfully`, 'success');
        await loadUsers();
        
    } catch (error) {
        hideLoading();
        showToast('Error: ' + error.message, 'error');
    }
}

// Load pending deposits
async function loadPendingDeposits() {
    const { data, error } = await supabase
        .from('investments')
        .select(`
            *,
            user:profiles(full_name, email),
            plan:investment_plans(name, weekly_return, duration_weeks)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    pendingDeposits = data;
    renderPendingDeposits();
}

// Render pending deposits
function renderPendingDeposits() {
    const table = document.getElementById('depositsTable');
    
    if (pendingDeposits.length === 0) {
        table.innerHTML = '<p style="text-align: center; padding: 2rem;">No pending deposits</p>';
        return;
    }
    
    table.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Proof</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${pendingDeposits.map(deposit => `
                    <tr>
                        <td>
                            <strong>${deposit.user?.full_name}</strong><br>
                            <small style="color: var(--accent-blue);">${deposit.user?.email}</small>
                        </td>
                        <td><strong>${deposit.plan?.name}</strong></td>
                        <td><strong>${formatCurrency(deposit.amount)}</strong></td>
                        <td>${formatDateTime(deposit.created_at)}</td>
                        <td>
                            ${deposit.proof_of_payment ? 
                                `<a href="${deposit.proof_of_payment}" target="_blank" class="btn btn-outline action-btn">View Proof</a>` 
                                : 'No proof'
                            }
                        </td>
                        <td>
                            <button class="btn btn-gold action-btn" onclick="reviewDeposit('${deposit.id}')">Review</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Review deposit
async function reviewDeposit(depositId) {
    showLoading();
    
    try {
        const { data: deposit, error } = await supabase
            .from('investments')
            .select(`
                *,
                user:profiles(full_name, email, crypto_wallet_address),
                plan:investment_plans(name, weekly_return, duration_weeks)
            `)
            .eq('id', depositId)
            .single();
        
        if (error) throw error;
        
        const returns = calculateReturns(
            parseFloat(deposit.amount),
            deposit.plan.weekly_return,
            deposit.plan.duration_weeks
        );
        
        document.getElementById('investmentDetails').innerHTML = `
            <div style="display: grid; gap: 1.5rem;">
                <div>
                    <h4 style="color: var(--primary-blue); margin-bottom: 1rem;">Investment Information</h4>
                    <div style="display: grid; gap: 0.75rem;">
                        <div><strong>User:</strong> ${deposit.user.full_name} (${deposit.user.email})</div>
                        <div><strong>Plan:</strong> ${deposit.plan.name}</div>
                        <div><strong>Amount:</strong> ${formatCurrency(deposit.amount)}</div>
                        <div><strong>Weekly Return:</strong> ${deposit.plan.weekly_return}%</div>
                        <div><strong>Duration:</strong> ${deposit.plan.duration_weeks} weeks</div>
                        <div><strong>Submitted:</strong> ${formatDateTime(deposit.created_at)}</div>
                    </div>
                </div>
                
                <div>
                    <h4 style="color: var(--primary-blue); margin-bottom: 1rem;">Expected Returns</h4>
                    <div style="background: var(--gray); padding: 1.5rem; border-radius: 8px;">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                            <div>
                                <div style="font-size: 0.85rem; color: var(--accent-blue);">Weekly Return</div>
                                <div style="font-size: 1.3rem; font-weight: 700; color: var(--primary-blue);">
                                    ${formatCurrency(returns.weeklyReturn)}
                                </div>
                            </div>
                            <div>
                                <div style="font-size: 0.85rem; color: var(--accent-blue);">Total Return</div>
                                <div style="font-size: 1.3rem; font-weight: 700; color: var(--success);">
                                    ${formatCurrency(returns.totalReturn)}
                                </div>
                            </div>
                            <div>
                                <div style="font-size: 0.85rem; color: var(--accent-blue);">Final Amount</div>
                                <div style="font-size: 1.3rem; font-weight: 700; color: var(--primary-blue);">
                                    ${formatCurrency(returns.finalAmount)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                ${deposit.proof_of_payment ? `
                    <div>
                        <h4 style="color: var(--primary-blue); margin-bottom: 1rem;">Proof of Payment</h4>
                        <img src="${deposit.proof_of_payment}" style="max-width: 100%; border-radius: 8px; border: 2px solid var(--gray);">
                    </div>
                ` : ''}
                
                ${deposit.transaction_hash ? `
                    <div>
                        <h4 style="color: var(--primary-blue); margin-bottom: 0.5rem;">Transaction Hash</h4>
                        <div style="background: var(--gray); padding: 1rem; border-radius: 8px; word-break: break-all; font-family: monospace;">
                            ${deposit.transaction_hash}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        currentItem = deposit;
        
        // Setup buttons
        document.getElementById('approveBtn').onclick = () => approveDeposit(depositId);
        document.getElementById('rejectBtn').onclick = () => rejectDeposit(depositId);
        
        hideLoading();
        showModal('investmentModal');
        
    } catch (error) {
        hideLoading();
        showToast('Error loading deposit: ' + error.message, 'error');
    }
}

// Approve deposit
async function approveDeposit(depositId) {
    if (!confirm('Approve this deposit and activate investment?')) return;
    
    showLoading();
    
    try {
        const deposit = currentItem;
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (deposit.plan.duration_weeks * 7));
        
        // Update investment status
        await supabase
            .from('investments')
            .update({
                status: 'active',
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', depositId);
        
        // Update transaction status
        await supabase
            .from('transactions')
            .update({ 
                status: 'approved',
                processed_at: new Date().toISOString()
            })
            .eq('investment_id', depositId);
        
        // Log audit
        await logAudit('deposit_approved', {
            investment_id: depositId,
            user_id: deposit.user_id,
            amount: deposit.amount
        });
        
        hideLoading();
        hideModal('investmentModal');
        showToast('Deposit approved and investment activated!', 'success');
        
        await loadPendingDeposits();
        await loadAllInvestments();
        
    } catch (error) {
        hideLoading();
        showToast('Error approving deposit: ' + error.message, 'error');
    }
}

// Reject deposit
async function rejectDeposit(depositId) {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    showLoading();
    
    try {
        await supabase
            .from('investments')
            .update({
                status: 'rejected',
                admin_notes: reason,
                updated_at: new Date().toISOString()
            })
            .eq('id', depositId);
        
        await supabase
            .from('transactions')
            .update({ 
                status: 'rejected',
                admin_notes: reason,
                processed_at: new Date().toISOString()
            })
            .eq('investment_id', depositId);
        
        await logAudit('deposit_rejected', {
            investment_id: depositId,
            reason: reason
        });
        
        hideLoading();
        hideModal('investmentModal');
        showToast('Deposit rejected', 'success');
        
        await loadPendingDeposits();
        
    } catch (error) {
        hideLoading();
        showToast('Error rejecting deposit: ' + error.message, 'error');
    }
}

// Load pending withdrawals
async function loadPendingWithdrawals() {
    const { data, error } = await supabase
        .from('transactions')
        .select(`
            *,
            user:profiles(full_name, email, crypto_wallet_address)
        `)
        .eq('type', 'withdrawal')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    pendingWithdrawals = data;
    renderPendingWithdrawals();
}

// Render pending withdrawals
function renderPendingWithdrawals() {
    const table = document.getElementById('withdrawalsTable');
    
    if (pendingWithdrawals.length === 0) {
        table.innerHTML = '<p style="text-align: center; padding: 2rem;">No pending withdrawals</p>';
        return;
    }
    
    table.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>User</th>
                    <th>Amount</th>
                    <th>Wallet Address</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${pendingWithdrawals.map(withdrawal => `
                    <tr>
                        <td>
                            <strong>${withdrawal.user?.full_name}</strong><br>
                            <small style="color: var(--accent-blue);">${withdrawal.user?.email}</small>
                        </td>
                        <td><strong>${formatCurrency(withdrawal.amount)}</strong></td>
                        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
                            <small style="font-family: monospace;">${withdrawal.user?.crypto_wallet_address || withdrawal.crypto_wallet}</small>
                        </td>
                        <td>${formatDateTime(withdrawal.created_at)}</td>
                        <td>
                            <button class="btn btn-gold action-btn" onclick="reviewWithdrawal('${withdrawal.id}')">Review</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Review withdrawal
async function reviewWithdrawal(withdrawalId) {
    showLoading();
    
    try {
        const { data: withdrawal, error } = await supabase
            .from('transactions')
            .select(`
                *,
                user:profiles(full_name, email, crypto_wallet_address)
            `)
            .eq('id', withdrawalId)
            .single();
        
        if (error) throw error;
        
        document.getElementById('withdrawalDetails').innerHTML = `
            <div style="display: grid; gap: 1.5rem;">
                <div>
                    <h4 style="color: var(--primary-blue); margin-bottom: 1rem;">Withdrawal Request</h4>
                    <div style="display: grid; gap: 0.75rem;">
                        <div><strong>User:</strong> ${withdrawal.user.full_name} (${withdrawal.user.email})</div>
                        <div><strong>Amount:</strong> <span style="font-size: 1.5rem; color: var(--primary-blue);">${formatCurrency(withdrawal.amount)}</span></div>
                        <div><strong>Requested:</strong> ${formatDateTime(withdrawal.created_at)}</div>
                    </div>
                </div>
                
                <div>
                    <h4 style="color: var(--primary-blue); margin-bottom: 0.5rem;">Send Crypto To:</h4>
                    <div style="background: var(--gray); padding: 1.5rem; border-radius: 8px; word-break: break-all; font-family: monospace; font-size: 0.95rem;">
                        ${withdrawal.user.crypto_wallet_address || withdrawal.crypto_wallet}
                    </div>
                    <button class="btn btn-outline" style="margin-top: 1rem; width: 100%;" onclick="copyToClipboard('${withdrawal.user.crypto_wallet_address || withdrawal.crypto_wallet}')">
                        Copy Address
                    </button>
                </div>
                
                <div style="background: rgba(245, 158, 11, 0.1); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--warning);">
                    <strong>⚠️ Important:</strong> Send the crypto manually to the address above, then click "Approve & Mark Sent" to complete the withdrawal.
                </div>
            </div>
        `;
        
        currentItem = withdrawal;
        
        // Setup buttons
        document.getElementById('approveWithdrawalBtn').onclick = () => approveWithdrawal(withdrawalId);
        document.getElementById('rejectWithdrawalBtn').onclick = () => rejectWithdrawal(withdrawalId);
        
        hideLoading();
        showModal('withdrawalModal');
        
    } catch (error) {
        hideLoading();
        showToast('Error loading withdrawal: ' + error.message, 'error');
    }
}

// Approve withdrawal
async function approveWithdrawal(withdrawalId) {
    const txHash = prompt('Enter blockchain transaction hash:');
    if (!txHash) return;
    
    showLoading();
    
    try {
        await supabase
            .from('transactions')
            .update({
                status: 'approved',
                transaction_hash: txHash,
                processed_at: new Date().toISOString()
            })
            .eq('id', withdrawalId);
        
        await logAudit('withdrawal_approved', {
            transaction_id: withdrawalId,
            tx_hash: txHash
        });
        
        hideLoading();
        hideModal('withdrawalModal');
        showToast('Withdrawal approved!', 'success');
        
        await loadPendingWithdrawals();
        await loadAllTransactions();
        
    } catch (error) {
        hideLoading();
        showToast('Error approving withdrawal: ' + error.message, 'error');
    }
}

// Reject withdrawal
async function rejectWithdrawal(withdrawalId) {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    showLoading();
    
    try {
        await supabase
            .from('transactions')
            .update({
                status: 'rejected',
                admin_notes: reason,
                processed_at: new Date().toISOString()
            })
            .eq('id', withdrawalId);
        
        await logAudit('withdrawal_rejected', {
            transaction_id: withdrawalId,
            reason: reason
        });
        
        hideLoading();
        hideModal('withdrawalModal');
        showToast('Withdrawal rejected', 'success');
        
        await loadPendingWithdrawals();
        
    } catch (error) {
        hideLoading();
        showToast('Error rejecting withdrawal: ' + error.message, 'error');
    }
}

// Load all investments
async function loadAllInvestments() {
    const { data, error } = await supabase
        .from('investments')
        .select(`
            *,
            user:profiles(full_name, email),
            plan:investment_plans(name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
    
    if (error) throw error;
    allInvestments = data;
    renderAllInvestments();
}

// Render all investments
function renderAllInvestments() {
    const table = document.getElementById('allInvestmentsTable');
    
    if (allInvestments.length === 0) {
        table.innerHTML = '<p style="text-align: center; padding: 2rem;">No investments found</p>';
        return;
    }
    
    table.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Returns</th>
                </tr>
            </thead>
            <tbody>
                ${allInvestments.map(inv => `
                    <tr>
                        <td>
                            <strong>${inv.user?.full_name}</strong><br>
                            <small style="color: var(--accent-blue);">${inv.user?.email}</small>
                        </td>
                        <td><strong>${inv.plan?.name}</strong></td>
                        <td>${formatCurrency(inv.amount)}</td>
                        <td>${getStatusBadge(inv.status)}</td>
                        <td>${inv.start_date ? formatDate(inv.start_date) : '-'}</td>
                        <td>${inv.end_date ? formatDate(inv.end_date) : '-'}</td>
                        <td><strong style="color: var(--success);">${formatCurrency(inv.total_return || 0)}</strong></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Load all transactions
async function loadAllTransactions() {
    const { data, error } = await supabase
        .from('transactions')
        .select(`
            *,
            user:profiles(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
    
    if (error) throw error;
    allTransactions = data;
    renderAllTransactions();
}

// Render all transactions
function renderAllTransactions() {
    const table = document.getElementById('allTransactionsTable');
    
    if (allTransactions.length === 0) {
        table.innerHTML = '<p style="text-align: center; padding: 2rem;">No transactions found</p>';
        return;
    }
    
    table.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>User</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>TX Hash</th>
                </tr>
            </thead>
            <tbody>
                ${allTransactions.map(tx => `
                    <tr>
                        <td>
                            <strong>${tx.user?.full_name}</strong><br>
                            <small style="color: var(--accent-blue);">${tx.user?.email}</small>
                        </td>
                        <td style="text-transform: capitalize;"><strong>${tx.type}</strong></td>
                        <td>${formatCurrency(tx.amount)}</td>
                        <td>${getStatusBadge(tx.status)}</td>
                        <td>${formatDateTime(tx.created_at)}</td>
                        <td>
                            ${tx.transaction_hash ? 
                                `<small style="font-family: monospace;">${tx.transaction_hash.substring(0, 16)}...</small>` 
                                : '-'
                            }
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}