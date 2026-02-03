'use client';

import { useMemo } from 'react';
import { Transaction, TransactionStatus, PaymentSource } from '@/types';

interface MonthlyReportProps {
  transactions: Transaction[];
  monthLabel: string;
  balance: number;
  onClose: () => void;
}

export function MonthlyReport({ transactions, monthLabel, balance, onClose }: MonthlyReportProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  // Filter to approved only
  const approvedTransactions = transactions.filter(t => t.status === TransactionStatus.APPROVED);

  // Separate income and expenses
  const incomeTransactions = approvedTransactions.filter(t => t.type === 'INCOME');
  const expenseTransactions = approvedTransactions.filter(t => t.type === 'EXPENSE' || t.type === 'REIMBURSEMENT');

  // Calculate totals
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netAmount = totalIncome - totalExpenses;

  // Group by category
  const incomeByCategory = useMemo(() => {
    const grouped: Record<string, { total: number; transactions: Transaction[] }> = {};
    incomeTransactions.forEach(tx => {
      if (!grouped[tx.category]) {
        grouped[tx.category] = { total: 0, transactions: [] };
      }
      grouped[tx.category].total += tx.amount;
      grouped[tx.category].transactions.push(tx);
    });
    return Object.entries(grouped).sort((a, b) => b[1].total - a[1].total);
  }, [incomeTransactions]);

  const expensesByCategory = useMemo(() => {
    const grouped: Record<string, { total: number; transactions: Transaction[] }> = {};
    expenseTransactions.forEach(tx => {
      if (!grouped[tx.category]) {
        grouped[tx.category] = { total: 0, transactions: [] };
      }
      grouped[tx.category].total += tx.amount;
      grouped[tx.category].transactions.push(tx);
    });
    return Object.entries(grouped).sort((a, b) => b[1].total - a[1].total);
  }, [expenseTransactions]);

  // Group by payment source
  const incomeBySource = useMemo(() => {
    const grouped: Record<string, number> = {};
    incomeTransactions.forEach(tx => {
      const source = tx.paymentSource || 'Other';
      grouped[source] = (grouped[source] || 0) + tx.amount;
    });
    return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  }, [incomeTransactions]);

  const expensesBySource = useMemo(() => {
    const grouped: Record<string, number> = {};
    expenseTransactions.forEach(tx => {
      const source = tx.paymentSource || 'Other';
      grouped[source] = (grouped[source] || 0) + tx.amount;
    });
    return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  }, [expenseTransactions]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: letter;
            margin: 0.75in;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          /* Prevent page breaks inside category sections */
          .category-section {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          /* Allow page breaks before category sections if needed */
          .category-section {
            break-before: auto;
            page-break-before: auto;
          }
          /* Prevent page breaks inside transaction rows */
          table tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          /* Keep summary box together */
          .summary-box {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          /* Keep payment source sections together */
          .payment-source-box {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
      <div className="fixed inset-0 z-50 overflow-auto bg-black/50 print:bg-white print:static">
        <div className="min-h-screen bg-white p-8 max-w-4xl mx-auto print:p-0 print:max-w-none">
        {/* Print/Close buttons - hidden when printing */}
        <div className="flex justify-end gap-2 mb-6 print:hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-rose-700 text-white rounded-lg hover:bg-rose-800 text-sm font-medium"
          >
            Print / Save PDF
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-sm font-medium"
          >
            Close
          </button>
        </div>

        {/* Report Header */}
        <div className="text-center mb-8 border-b-2 border-rose-700 pb-6">
          <h1 className="text-2xl font-bold text-rose-900">ABWA-Douglas Chapter</h1>
          <h2 className="text-xl font-semibold text-slate-700 mt-1">Financial Report</h2>
          <p className="text-lg text-slate-600 mt-2">{monthLabel}</p>
          <p className="text-sm text-slate-500 mt-1">Generated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Summary Box */}
        <div className="summary-box bg-slate-50 border border-slate-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase">Opening Balance</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(balance - netAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">Total Income</p>
              <p className="text-xl font-bold text-emerald-600">+{formatCurrency(totalIncome)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">Total Expenses</p>
              <p className="text-xl font-bold text-rose-600">-{formatCurrency(totalExpenses)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">Closing Balance</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(balance)}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-700">Net Change:</span>
              <span className={`text-xl font-bold ${netAmount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {netAmount >= 0 ? '+' : ''}{formatCurrency(netAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Income Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-emerald-800 mb-4 border-b border-emerald-200 pb-2">
            Income ({incomeTransactions.length} transactions)
          </h3>

          {/* Income by Source */}
          {incomeBySource.length > 0 && (
            <div className="payment-source-box mb-4 bg-emerald-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-emerald-700 mb-2">By Payment Source</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {incomeBySource.map(([source, amount]) => (
                  <div key={source} className="flex justify-between text-sm">
                    <span className="text-slate-600">{source}:</span>
                    <span className="font-medium text-emerald-700">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Income by Category */}
          {incomeByCategory.map(([category, data]) => (
            <div key={category} className="category-section mb-4">
              <div className="flex justify-between items-center bg-slate-100 px-3 py-2 rounded">
                <span className="font-medium text-slate-700">{category}</span>
                <span className="font-bold text-emerald-600">{formatCurrency(data.total)}</span>
              </div>
              <table className="w-full text-sm mt-1">
                <tbody>
                  {data.transactions.map(tx => (
                    <tr key={tx.id} className="border-b border-slate-100">
                      <td className="py-1.5 text-slate-500 w-24">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className="py-1.5 text-slate-700">{tx.merchant}</td>
                      <td className="py-1.5 text-slate-400 text-xs">{tx.paymentSource || ''}</td>
                      <td className="py-1.5 text-right text-emerald-600 font-medium">{formatCurrency(tx.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <div className="flex justify-end border-t-2 border-emerald-300 pt-2 mt-4">
            <span className="font-bold text-emerald-800 text-lg">Total Income: {formatCurrency(totalIncome)}</span>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-rose-800 mb-4 border-b border-rose-200 pb-2">
            Expenses ({expenseTransactions.length} transactions)
          </h3>

          {/* Expenses by Source */}
          {expensesBySource.length > 0 && (
            <div className="payment-source-box mb-4 bg-rose-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-rose-700 mb-2">By Payment Method</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {expensesBySource.map(([source, amount]) => (
                  <div key={source} className="flex justify-between text-sm">
                    <span className="text-slate-600">{source}:</span>
                    <span className="font-medium text-rose-700">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expenses by Category */}
          {expensesByCategory.map(([category, data]) => (
            <div key={category} className="category-section mb-4">
              <div className="flex justify-between items-center bg-slate-100 px-3 py-2 rounded">
                <span className="font-medium text-slate-700">{category}</span>
                <span className="font-bold text-rose-600">{formatCurrency(data.total)}</span>
              </div>
              <table className="w-full text-sm mt-1">
                <tbody>
                  {data.transactions.map(tx => (
                    <tr key={tx.id} className="border-b border-slate-100">
                      <td className="py-1.5 text-slate-500 w-24">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className="py-1.5 text-slate-700">{tx.merchant}</td>
                      <td className="py-1.5 text-slate-400 text-xs">{tx.paymentSource || ''}</td>
                      <td className="py-1.5 text-right text-rose-600 font-medium">{formatCurrency(tx.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <div className="flex justify-end border-t-2 border-rose-300 pt-2 mt-4">
            <span className="font-bold text-rose-800 text-lg">Total Expenses: {formatCurrency(totalExpenses)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 border-t border-slate-200 pt-4 mt-8">
          <p>ABWA-Douglas Chapter Financial Report - {monthLabel}</p>
          <p className="text-xs mt-1">This report was generated automatically. Please verify all figures.</p>
        </div>
      </div>
    </div>
    </>
  );
}
