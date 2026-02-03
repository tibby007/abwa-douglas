'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, LogOut } from 'lucide-react';
import { Sidebar, Dashboard, RequestForm, TransactionHistory, BudgetManager } from '@/components';
import { Transaction, TransactionStatus, ViewState, Committee } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'abwa-douglas-data';

// Initial Mock Data based on User CSV (Nov 7 - Dec 9, 2025)
const INITIAL_DATA: Transaction[] = [
  {
    id: 'tx-pending-1',
    date: '2025-12-09',
    amount: 45.00,
    merchant: 'Merchant Services',
    category: 'Fees & Charges',
    description: 'PREAUTHORIZED WD MERCHANT SVCS MEMX113025',
    type: 'EXPENSE',
    status: TransactionStatus.PENDING,
    submittedBy: 'Bank Import'
  },
  {
    id: 'tx-pending-2',
    date: '2025-12-09',
    amount: 35.00,
    merchant: 'Merchant Services',
    category: 'Fees & Charges',
    description: 'PREAUTHORIZED WD MERCHANT SVCS MEMX113025',
    type: 'EXPENSE',
    status: TransactionStatus.PENDING,
    submittedBy: 'Bank Import'
  },
  {
    id: 'tx-posted-1',
    date: '2025-12-08',
    amount: 931.90,
    merchant: 'Zelle Transfer',
    category: 'Transfer',
    description: 'Outgoing Zelle Transfer',
    type: 'EXPENSE',
    status: TransactionStatus.APPROVED,
    submittedBy: 'Bank Import'
  },
  {
    id: 'tx-posted-2',
    date: '2025-12-02',
    amount: 36.00,
    merchant: 'PayPal',
    category: 'Misc',
    description: 'PayPal Purchase',
    type: 'EXPENSE',
    status: TransactionStatus.APPROVED,
    submittedBy: 'Bank Import'
  },
  {
    id: 'tx-posted-3',
    date: '2025-12-01',
    amount: 10.00,
    merchant: 'Zoom',
    category: 'Electronics & Software',
    description: 'Zoom Subscription',
    type: 'EXPENSE',
    status: TransactionStatus.APPROVED,
    submittedBy: 'Bank Import'
  },
  {
    id: 'tx-posted-4',
    date: '2025-11-28',
    amount: 75.62,
    merchant: 'GotPrint',
    category: 'Business Services',
    description: 'GotPrint Order',
    type: 'EXPENSE',
    status: TransactionStatus.APPROVED,
    submittedBy: 'Bank Import'
  },
  {
    id: 'tx-posted-5',
    date: '2025-11-28',
    amount: 19.00,
    merchant: 'Call Em All',
    category: 'Misc',
    description: 'Call Em All Tx Tran',
    type: 'EXPENSE',
    status: TransactionStatus.APPROVED,
    submittedBy: 'Bank Import'
  },
  {
    id: 'tx-posted-6',
    date: '2025-11-28',
    amount: 70.00,
    merchant: 'Zelle Transfer',
    category: 'Transfer',
    description: 'Outgoing Zelle Transfer',
    type: 'EXPENSE',
    status: TransactionStatus.APPROVED,
    submittedBy: 'Bank Import'
  },
  {
    id: 'tx-posted-7',
    date: '2025-11-28',
    amount: 30.00,
    merchant: 'Zelle Transfer',
    category: 'Transfer',
    description: 'Incoming Zelle Transfer',
    type: 'INCOME',
    status: TransactionStatus.APPROVED,
    submittedBy: 'Bank Import'
  },
  {
    id: 'tx-posted-8',
    date: '2025-11-26',
    amount: 132.00,
    merchant: 'Zelle Transfer',
    category: 'Transfer',
    description: 'Incoming Zelle Transfer',
    type: 'INCOME',
    status: TransactionStatus.APPROVED,
    submittedBy: 'Bank Import'
  }
];

export default function Home() {
  const router = useRouter();
  const { user, profile, loading: authLoading, signOut, isTreasurer, isOfficer } = useAuth();

  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [balance, setBalance] = useState<number>(1174.95);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_DATA);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load transactions from Supabase on mount
  useEffect(() => {
    if (!user) return;

    const loadFromSupabase = async () => {
      try {
        // Load transactions
        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });

        if (txError) {
          console.error('Error loading transactions:', txError);
          // Fallback to localStorage if Supabase fails
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const data = JSON.parse(saved);
            if (data.transactions) setTransactions(data.transactions);
            if (typeof data.balance === 'number') setBalance(data.balance);
          }
        } else if (txData) {
          // Map Supabase data to Transaction type
          const mappedTransactions: Transaction[] = txData.map(tx => ({
            id: tx.id,
            date: tx.date,
            amount: parseFloat(tx.amount),
            merchant: tx.merchant,
            category: tx.category,
            description: tx.description || '',
            type: tx.type,
            status: tx.status,
            submittedBy: tx.submitted_by,
            paymentSource: tx.payment_source,
            committeeId: tx.committee_id
          }));
          setTransactions(mappedTransactions);
        }

        // Load balance from chapter_settings
        const { data: balanceData, error: balanceError } = await supabase
          .from('chapter_settings')
          .select('value')
          .eq('key', 'balance')
          .single();

        if (!balanceError && balanceData) {
          const balanceAmount = balanceData.value?.amount;
          if (typeof balanceAmount === 'number') {
            setBalance(balanceAmount);
          }
        }

        // Load committees
        const { data: committeeData, error: committeeError } = await supabase
          .from('committees')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (!committeeError && committeeData) {
          const mappedCommittees: Committee[] = committeeData.map(c => ({
            id: c.id,
            name: c.name,
            annualBudget: parseFloat(c.annual_budget) || 0,
            description: c.description,
            chairName: c.chair_name,
            isActive: c.is_active,
            createdAt: c.created_at,
            updatedAt: c.updated_at
          }));
          setCommittees(mappedCommittees);
        }
      } catch (e) {
        console.error('Failed to load data from Supabase:', e);
      } finally {
        setIsLoaded(true);
      }
    };

    loadFromSupabase();
  }, [user]);

  // Save to localStorage as backup whenever data changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ transactions, balance }));
    }
  }, [transactions, balance, isLoaded]);

  const pendingCount = transactions.filter(t => t.status === TransactionStatus.PENDING).length;

  const handleProcessTransaction = async (id: string, status: TransactionStatus) => {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('transactions')
        .update({
          status,
          processed_by: profile?.full_name || profile?.email,
          processed_by_user_id: user?.id,
          processed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating transaction:', error);
        alert('Failed to update transaction. Please try again.');
        return;
      }

      // Update local state
      setTransactions(prev => prev.map(t =>
        t.id === id ? { ...t, status } : t
      ));

      // Update balance if approved
      const tx = transactions.find(t => t.id === id);
      if (tx && status === TransactionStatus.APPROVED && tx.submittedBy !== 'Bank Import' && tx.submittedBy !== 'System Import') {
        let newBalance = balance;
        if (tx.type === 'EXPENSE' || tx.type === 'REIMBURSEMENT') {
          newBalance = balance - tx.amount;
        } else if (tx.type === 'INCOME') {
          newBalance = balance + tx.amount;
        }
        setBalance(newBalance);
        await updateBalanceInSupabase(newBalance);
      }
    } catch (err) {
      console.error('Error processing transaction:', err);
      alert('Failed to update transaction. Please try again.');
    }
  };

  const updateBalanceInSupabase = async (newBalance: number) => {
    try {
      const { error } = await supabase
        .from('chapter_settings')
        .update({ value: { amount: newBalance }, updated_at: new Date().toISOString() })
        .eq('key', 'balance');

      if (error) {
        console.error('Error updating balance:', error);
      }
    } catch (err) {
      console.error('Error updating balance:', err);
    }
  };

  const handleNewTransaction = async (transaction: Transaction) => {
    try {
      // Save to Supabase - let database generate UUID
      const { data, error } = await supabase.from('transactions').insert({
        date: transaction.date,
        merchant: transaction.merchant,
        description: transaction.description,
        amount: transaction.amount,
        category: transaction.category,
        type: transaction.type,
        status: transaction.status,
        payment_source: transaction.paymentSource,
        submitted_by: transaction.submittedBy,
        submitted_by_user_id: user?.id,
        committee_id: transaction.committeeId || null
      }).select().single();

      if (error) {
        console.error('Error saving transaction:', error);
        alert('Failed to save transaction. Please try again.');
        return;
      }

      // Update local state with the transaction that has the database-generated UUID
      if (data) {
        const savedTransaction: Transaction = {
          id: data.id,
          date: data.date,
          amount: parseFloat(data.amount),
          merchant: data.merchant,
          category: data.category,
          description: data.description || '',
          type: data.type,
          status: data.status,
          submittedBy: data.submitted_by,
          paymentSource: data.payment_source,
          committeeId: data.committee_id,
          committeeName: transaction.committeeName
        };
        setTransactions(prev => [savedTransaction, ...prev]);
      }
      setCurrentView('dashboard');
    } catch (err) {
      console.error('Error creating transaction:', err);
      alert('Failed to save transaction. Please try again.');
    }
  };

  const handleImportTransactions = async (newTxs: Transaction[]) => {
    try {
      // Save to Supabase - let database generate UUIDs
      const { data, error } = await supabase.from('transactions').insert(
        newTxs.map(tx => ({
          date: tx.date,
          merchant: tx.merchant,
          description: tx.description,
          amount: tx.amount,
          category: tx.category,
          type: tx.type,
          status: tx.status,
          payment_source: tx.paymentSource,
          submitted_by: tx.submittedBy,
          is_from_import: true
        }))
      ).select();

      if (error) {
        console.error('Error importing transactions:', error);
        alert('Failed to import some transactions. Please try again.');
        return;
      }

      // Update local state with transactions that have database-generated UUIDs
      if (data) {
        const savedTransactions: Transaction[] = data.map(tx => ({
          id: tx.id,
          date: tx.date,
          amount: parseFloat(tx.amount),
          merchant: tx.merchant,
          category: tx.category,
          description: tx.description || '',
          type: tx.type,
          status: tx.status,
          submittedBy: tx.submitted_by,
          paymentSource: tx.payment_source
        }));
        setTransactions(prev => [...savedTransactions, ...prev]);
      }
    } catch (err) {
      console.error('Error importing transactions:', err);
      alert('Failed to import transactions. Please try again.');
    }
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to delete ALL transactions? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete all transactions from Supabase
      const { error } = await supabase
        .from('transactions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using dummy condition)

      if (error) {
        console.error('Error deleting transactions:', error);
        alert('Failed to clear data. Please try again.');
        return;
      }

      // Reset balance in Supabase
      await updateBalanceInSupabase(0);

      // Clear local state
      setTransactions([]);
      setBalance(0);
      localStorage.removeItem(STORAGE_KEY);
      alert('All data cleared successfully.');
    } catch (err) {
      console.error('Error clearing data:', err);
      alert('Failed to clear data. Please try again.');
    }
  };

  // Auto-reconcile outstanding transactions when bank import matches
  const handleReconcile = async (transactionIds: string[]) => {
    try {
      // Update status in Supabase for all reconciled transactions
      const { error } = await supabase
        .from('transactions')
        .update({
          status: TransactionStatus.APPROVED,
          processed_by: 'Auto-Reconciled',
          processed_at: new Date().toISOString()
        })
        .in('id', transactionIds);

      if (error) {
        console.error('Error reconciling transactions:', error);
        return;
      }

      // Update local state
      setTransactions(prev => prev.map(tx =>
        transactionIds.includes(tx.id)
          ? { ...tx, status: TransactionStatus.APPROVED }
          : tx
      ));
    } catch (err) {
      console.error('Error reconciling transactions:', err);
    }
  };

  // Handle manual balance updates
  const handleUpdateBalance = async (newBalance: number) => {
    setBalance(newBalance);
    await updateBalanceInSupabase(newBalance);
  };

  // Committee management functions
  const handleAddCommittee = async (committee: Omit<Committee, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase.from('committees').insert({
        name: committee.name,
        annual_budget: committee.annualBudget,
        description: committee.description,
        chair_name: committee.chairName,
        is_active: committee.isActive
      }).select().single();

      if (error) {
        console.error('Error adding committee:', error);
        alert('Failed to add committee. Please try again.');
        return;
      }

      if (data) {
        const newCommittee: Committee = {
          id: data.id,
          name: data.name,
          annualBudget: parseFloat(data.annual_budget) || 0,
          description: data.description,
          chairName: data.chair_name,
          isActive: data.is_active,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
        setCommittees(prev => [...prev, newCommittee].sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (err) {
      console.error('Error adding committee:', err);
      alert('Failed to add committee. Please try again.');
    }
  };

  const handleUpdateCommittee = async (id: string, updates: Partial<Committee>) => {
    try {
      const { error } = await supabase.from('committees').update({
        name: updates.name,
        annual_budget: updates.annualBudget,
        description: updates.description,
        chair_name: updates.chairName,
        is_active: updates.isActive,
        updated_at: new Date().toISOString()
      }).eq('id', id);

      if (error) {
        console.error('Error updating committee:', error);
        alert('Failed to update committee. Please try again.');
        return;
      }

      setCommittees(prev => prev.map(c =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      ).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('Error updating committee:', err);
      alert('Failed to update committee. Please try again.');
    }
  };

  const handleDeleteCommittee = async (id: string) => {
    try {
      const { error } = await supabase.from('committees').delete().eq('id', id);

      if (error) {
        console.error('Error deleting committee:', error);
        alert('Failed to delete committee. Please try again.');
        return;
      }

      setCommittees(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting committee:', err);
      alert('Failed to delete committee. Please try again.');
    }
  };

  const handleViewChange = (view: ViewState) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-rose-900 p-2 mb-4">
            <div className="flex h-full w-full flex-col items-center justify-center rounded bg-white">
              <span className="text-lg font-black tracking-tighter text-rose-800 leading-none">ABWA</span>
            </div>
          </div>
          <div className="animate-spin h-8 w-8 border-4 border-rose-200 border-t-rose-700 rounded-full mx-auto"></div>
          <p className="mt-4 text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900">
      {/* Mobile Header */}
      <div className="fixed top-0 z-20 flex w-full items-center justify-between border-b border-slate-200 bg-rose-900 px-4 py-3 text-white md:hidden">
        <h1 className="font-bold">ABWA-Douglas Chapter</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar - Desktop & Mobile */}
      <div className={`fixed inset-y-0 left-0 z-10 w-64 transform bg-rose-900 text-white transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="pt-16 md:pt-0 h-full">
           <Sidebar
             currentView={currentView}
             onChangeView={handleViewChange}
             pendingCount={pendingCount}
             profile={profile}
             isTreasurer={isTreasurer}
             onSignOut={handleSignOut}
           />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pt-20 md:p-8 md:pt-8">
        <div className="mx-auto max-w-6xl">
          {currentView === 'dashboard' && (
            <Dashboard
              transactions={transactions}
              balance={balance}
              onUpdateBalance={handleUpdateBalance}
              onProcess={handleProcessTransaction}
              onNavigate={handleViewChange}
              isTreasurer={isTreasurer}
              userName={profile?.full_name?.split(' ')[0]}
            />
          )}

          {currentView === 'request' && (
            <RequestForm
              onSubmit={handleNewTransaction}
              onCancel={() => handleViewChange('dashboard')}
              userName={profile?.full_name || profile?.email || 'Unknown'}
              isTreasurer={isTreasurer}
              committees={committees}
            />
          )}

          {currentView === 'budgets' && (
            <BudgetManager
              committees={committees}
              transactions={transactions}
              isTreasurer={isTreasurer}
              onAddCommittee={handleAddCommittee}
              onUpdateCommittee={handleUpdateCommittee}
              onDeleteCommittee={handleDeleteCommittee}
            />
          )}

          {currentView === 'history' && isTreasurer && (
            <TransactionHistory
              transactions={transactions}
              balance={balance}
              onImport={handleImportTransactions}
              onUpdateBalance={handleUpdateBalance}
              onClearData={handleClearData}
              onReconcile={handleReconcile}
            />
          )}
        </div>
      </main>
    </div>
  );
}
