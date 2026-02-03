'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar, Dashboard, RequestForm, TransactionHistory } from '@/components';
import { Transaction, TransactionStatus, ViewState } from '@/types';

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
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [balance, setBalance] = useState<number>(1174.95);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_DATA);

  const pendingCount = transactions.filter(t => t.status === TransactionStatus.PENDING).length;

  const handleProcessTransaction = (id: string, status: TransactionStatus) => {
    setTransactions(prev => prev.map(t =>
      t.id === id ? { ...t, status } : t
    ));

    const tx = transactions.find(t => t.id === id);
    if (tx && status === TransactionStatus.APPROVED && tx.submittedBy !== 'Bank Import' && tx.submittedBy !== 'System Import') {
       if (tx.type === 'EXPENSE' || tx.type === 'REIMBURSEMENT') {
          setBalance(b => b - tx.amount);
       } else if (tx.type === 'INCOME') {
          setBalance(b => b + tx.amount);
       }
    }
  };

  const handleNewTransaction = (transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
    setCurrentView('dashboard');
  };

  const handleImportTransactions = (newTxs: Transaction[]) => {
    setTransactions(prev => [...newTxs, ...prev]);
  };

  const handleViewChange = (view: ViewState) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

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
              onUpdateBalance={setBalance}
              onProcess={handleProcessTransaction}
              onNavigate={handleViewChange}
            />
          )}

          {currentView === 'request' && (
            <RequestForm
              onSubmit={handleNewTransaction}
              onCancel={() => handleViewChange('dashboard')}
            />
          )}

          {currentView === 'history' && (
            <TransactionHistory
              transactions={transactions}
              onImport={handleImportTransactions}
              onUpdateBalance={setBalance}
            />
          )}
        </div>
      </main>
    </div>
  );
}
