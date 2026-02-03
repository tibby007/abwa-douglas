'use client';

import { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionStatus, ViewState } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CheckCircle, XCircle, TrendingUp, TrendingDown, DollarSign, Edit2, Check, Calendar } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  onProcess: (id: string, status: TransactionStatus) => void;
  onNavigate: (view: ViewState) => void;
  isTreasurer: boolean;
  userName?: string;
}

const COLORS = ['#be123c', '#fbbf24', '#334155', '#94a3b8', '#475569'];

// Generate month options from transactions
function getMonthOptions(transactions: Transaction[]): { value: string; label: string }[] {
  const months = new Set<string>();
  transactions.forEach(tx => {
    const date = new Date(tx.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months.add(monthKey);
  });

  const sortedMonths = Array.from(months).sort().reverse();
  const options = sortedMonths.map(m => {
    const [year, month] = m.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return {
      value: m,
      label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
  });

  return [{ value: 'all', label: 'All Time' }, ...options];
}

export function Dashboard({ transactions, balance, onUpdateBalance, onProcess, onNavigate, isTreasurer, userName }: DashboardProps) {
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [tempBalance, setTempBalance] = useState(balance.toString());
  const [selectedMonth, setSelectedMonth] = useState('all');

  useEffect(() => {
    setTempBalance(balance.toString());
  }, [balance]);

  const monthOptions = useMemo(() => getMonthOptions(transactions), [transactions]);

  // Filter transactions by selected month
  const filteredTransactions = useMemo(() => {
    if (selectedMonth === 'all') return transactions;
    return transactions.filter(tx => {
      const date = new Date(tx.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return monthKey === selectedMonth;
    });
  }, [transactions, selectedMonth]);

  const pendingTransactions = filteredTransactions.filter(t => t.status === TransactionStatus.PENDING);

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'INCOME' && t.status === TransactionStatus.APPROVED)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => (t.type === 'EXPENSE' || t.type === 'REIMBURSEMENT') && t.status === TransactionStatus.APPROVED)
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingDebits = pendingTransactions
    .filter(t => t.type === 'EXPENSE' || t.type === 'REIMBURSEMENT')
    .reduce((sum, t) => sum + t.amount, 0);

  const availableBalance = balance - pendingDebits;

  const expensesByCategory = filteredTransactions
    .filter(t => (t.type === 'EXPENSE' || t.type === 'REIMBURSEMENT') && t.status === TransactionStatus.APPROVED)
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  }));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const saveBalance = () => {
    const val = parseFloat(tempBalance);
    if (!isNaN(val)) {
      onUpdateBalance(val);
    }
    setIsEditingBalance(false);
  };

  // Get selected month label for display
  const selectedMonthLabel = monthOptions.find(m => m.value === selectedMonth)?.label || 'All Time';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Financial Overview</h2>
          <p className="text-slate-500">Welcome back{userName ? `, ${userName}` : ''}.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              {monthOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => onNavigate('request')}
            className="inline-flex items-center justify-center rounded-lg bg-rose-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-rose-800 focus:outline-none focus:ring-4 focus:ring-rose-300"
          >
            {isTreasurer ? '+ Record Transaction' : '+ Submit Request'}
          </button>
        </div>
      </div>

      {/* Month indicator banner */}
      {selectedMonth !== 'all' && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800">
          <strong>Viewing:</strong> {selectedMonthLabel} — Income, expenses, and chart below are filtered to this period.
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Balance Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
              <DollarSign size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Current Posted Balance</p>
                {isTreasurer && (
                  !isEditingBalance ? (
                    <button onClick={() => setIsEditingBalance(true)} className="text-slate-400 hover:text-slate-600">
                      <Edit2 size={14} />
                    </button>
                  ) : (
                    <button onClick={saveBalance} className="text-emerald-600 hover:text-emerald-700">
                      <Check size={16} />
                    </button>
                  )
                )}
              </div>

              {isEditingBalance ? (
                <input
                  type="number"
                  value={tempBalance}
                  onChange={(e) => setTempBalance(e.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-lg font-bold"
                  autoFocus
                  onBlur={saveBalance}
                  onKeyDown={(e) => e.key === 'Enter' && saveBalance()}
                />
              ) : (
                <div>
                   <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(balance)}</h3>
                   {pendingDebits > 0 && (
                     <p className="text-xs text-amber-600 font-medium mt-1">
                       Available: {formatCurrency(availableBalance)} (Pending: -{formatCurrency(pendingDebits)})
                     </p>
                   )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-slate-100 p-3 text-slate-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                {selectedMonth === 'all' ? 'Total Income' : `${selectedMonthLabel} Income`}
              </p>
              <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(totalIncome)}</h3>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-rose-100 p-3 text-rose-600">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                {selectedMonth === 'all' ? 'Total Expenses' : `${selectedMonthLabel} Expenses`}
              </p>
              <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(totalExpenses)}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Summary Card - only show when month is selected */}
      {selectedMonth !== 'all' && (
        <div className="rounded-xl border-2 border-rose-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">{selectedMonthLabel} Summary</h3>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Transactions</p>
              <p className="text-xl font-bold text-slate-900">{filteredTransactions.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Total Income</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Total Expenses</p>
              <p className="text-xl font-bold text-rose-600">{formatCurrency(totalExpenses)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Net</p>
              <p className={`text-xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(totalIncome - totalExpenses)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Outstanding Transactions */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Outstanding Transactions</h3>
              {pendingTransactions.length > 0 && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  {pendingTransactions.length} Uncleared
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Checks written, payments sent - not yet on bank statement</p>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {pendingTransactions.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center text-slate-400">
                <CheckCircle size={40} className="mb-2 opacity-50" />
                <p>No outstanding transactions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTransactions.map((tx) => (
                  <div key={tx.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition-shadow hover:shadow-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900">{tx.merchant}</h4>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide
                             ${tx.type === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {tx.type}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{tx.description}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <span>{new Date(tx.date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{tx.category}</span>
                          <span>•</span>
                          <span className="font-medium text-slate-700">By: {tx.submittedBy}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">{formatCurrency(tx.amount)}</p>
                        {isTreasurer && (
                          <div className="mt-2 flex justify-end gap-2">
                            <button
                              onClick={() => onProcess(tx.id, TransactionStatus.REJECTED)}
                              className="rounded p-1.5 text-red-600 hover:bg-red-100"
                              title="Void Transaction"
                            >
                              <XCircle size={20} />
                            </button>
                            <button
                              onClick={() => onProcess(tx.id, TransactionStatus.APPROVED)}
                              className="rounded p-1.5 text-emerald-600 hover:bg-emerald-100"
                              title="Mark as Cleared"
                            >
                              <CheckCircle size={20} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-900">
            {selectedMonth === 'all' ? 'Expenses by Category' : `${selectedMonthLabel} Expenses`}
          </h3>
          <div className="h-64 w-full">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">
                <p>No expense data for this period</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
