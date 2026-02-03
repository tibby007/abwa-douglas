'use client';

import { useState, useEffect } from 'react';
import { Transaction, TransactionStatus, ViewState } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CheckCircle, XCircle, TrendingUp, TrendingDown, DollarSign, Edit2, Check } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  balance: number;
  onUpdateBalance: (newBalance: number) => void;
  onProcess: (id: string, status: TransactionStatus) => void;
  onNavigate: (view: ViewState) => void;
}

const COLORS = ['#be123c', '#fbbf24', '#334155', '#94a3b8', '#475569'];

export function Dashboard({ transactions, balance, onUpdateBalance, onProcess, onNavigate }: DashboardProps) {
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [tempBalance, setTempBalance] = useState(balance.toString());

  useEffect(() => {
    setTempBalance(balance.toString());
  }, [balance]);

  const pendingTransactions = transactions.filter(t => t.status === TransactionStatus.PENDING);

  const totalIncome = transactions
    .filter(t => t.type === 'INCOME' && t.status === TransactionStatus.APPROVED)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => (t.type === 'EXPENSE' || t.type === 'REIMBURSEMENT') && t.status === TransactionStatus.APPROVED)
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingDebits = pendingTransactions
    .filter(t => t.type === 'EXPENSE' || t.type === 'REIMBURSEMENT')
    .reduce((sum, t) => sum + t.amount, 0);

  const availableBalance = balance - pendingDebits;

  const expensesByCategory = transactions
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Financial Overview</h2>
          <p className="text-slate-500">Welcome back, Treasurer.</p>
        </div>
        <button
          onClick={() => onNavigate('request')}
          className="inline-flex items-center justify-center rounded-lg bg-rose-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-rose-800 focus:outline-none focus:ring-4 focus:ring-rose-300"
        >
          + Submit Transaction
        </button>
      </div>

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
                {!isEditingBalance ? (
                  <button onClick={() => setIsEditingBalance(true)} className="text-slate-400 hover:text-slate-600">
                    <Edit2 size={14} />
                  </button>
                ) : (
                  <button onClick={saveBalance} className="text-emerald-600 hover:text-emerald-700">
                    <Check size={16} />
                  </button>
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
              <p className="text-sm font-medium text-slate-500">Recorded Income</p>
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
              <p className="text-sm font-medium text-slate-500">Recorded Expenses</p>
              <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(totalExpenses)}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Approvals */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Pending Approvals</h3>
              {pendingTransactions.length > 0 && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  {pendingTransactions.length} Needs Action
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {pendingTransactions.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center text-slate-400">
                <CheckCircle size={40} className="mb-2 opacity-50" />
                <p>All caught up! No pending requests.</p>
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
                        <div className="mt-2 flex justify-end gap-2">
                          <button
                            onClick={() => onProcess(tx.id, TransactionStatus.REJECTED)}
                            className="rounded p-1.5 text-red-600 hover:bg-red-100"
                            title="Reject"
                          >
                            <XCircle size={20} />
                          </button>
                          <button
                            onClick={() => onProcess(tx.id, TransactionStatus.APPROVED)}
                            className="rounded p-1.5 text-emerald-600 hover:bg-emerald-100"
                            title="Approve"
                          >
                            <CheckCircle size={20} />
                          </button>
                        </div>
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
          <h3 className="mb-4 font-semibold text-slate-900">Expenses by Category</h3>
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
                <p>Not enough data to display chart</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
