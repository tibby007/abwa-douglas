'use client';

import { useRef, useState, useMemo } from 'react';
import { Transaction, TransactionStatus, CATEGORIES, PaymentSource } from '@/types';
import { Download, Search, UploadCloud, AlertCircle, ArrowUpRight, ArrowDownLeft, Calendar, FileText } from 'lucide-react';
import { MonthlyReport } from './MonthlyReport';

interface HistoryProps {
  transactions: Transaction[];
  balance: number;
  onImport?: (transactions: Transaction[]) => void;
  onUpdateBalance?: (balance: number) => void;
}

function getMonthOptions(transactions: Transaction[]): { value: string; label: string }[] {
  const months = new Set<string>();
  transactions.forEach(tx => {
    const date = new Date(tx.date);
    const monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
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

function detectPaymentSource(description: string): PaymentSource {
  const upper = description.toUpperCase();
  if (upper.includes('WIX') || upper.includes('WIXCOM')) return 'Wix Payments';
  if (upper.includes('ZELLE')) return 'Zelle';
  if (upper.includes('CASHAPP') || upper.includes('CASH APP') || upper.includes('SQUARE CASH')) return 'CashApp';
  if (upper.includes('PAYPAL')) return 'PayPal';
  if (upper.includes('VENMO')) return 'Venmo';
  if (upper.includes('CHECK') || upper.includes('CHK')) return 'Check';
  if (upper.includes('ACH') || upper.includes('TRANSFER') || upper.includes('XFER')) return 'Bank Transfer';
  if (upper.includes('VISA') || upper.includes('MASTERCARD') || upper.includes('AMEX')) return 'Credit Card';
  if (upper.includes('DEBIT')) return 'Debit Card';
  return 'Other';
}

function detectCategory(description: string, type: 'INCOME' | 'EXPENSE'): string {
  const upper = description.toUpperCase();
  if (type === 'INCOME') {
    if (upper.includes('DUES') || upper.includes('MEMBER')) return 'Membership Dues';
    if (upper.includes('REGISTRATION') || upper.includes('TICKET')) return 'Event Registration';
    if (upper.includes('SPONSOR')) return 'Sponsorship';
    if (upper.includes('DONATION')) return 'Donations Received';
    if (upper.includes('FUNDRAIS')) return 'Fundraising';
    if (upper.includes('WORKSHOP')) return 'Workshop Fees';
    return 'Misc Income';
  } else {
    if (upper.includes('ZOOM') || upper.includes('SOFTWARE')) return 'Subscriptions';
    if (upper.includes('PRINT') || upper.includes('GOTPRINT')) return 'Printing & Stationery';
    if (upper.includes('FOOD') || upper.includes('PUBLIX') || upper.includes('CATERING')) return 'Catering & Food';
    if (upper.includes('FEE') || upper.includes('MERCHANT')) return 'Processing Fees';
    if (upper.includes('GIFT') || upper.includes('SPEAKER')) return 'Speaker Gifts';
    return 'Misc Expense';
  }
}

function extractMerchantName(description: string): string {
  if (!description) return 'Bank Transaction';
  const cleanDesc = description.trim();
  const upperDesc = cleanDesc.toUpperCase();

  if (upperDesc.includes('ZELLE')) {
    const match = cleanDesc.match(/ZELLE\s+([A-Za-z\s]+?)(?:\s+\d|$)/i);
    if (match && match[1] && match[1].trim().length > 1) return match[1].trim();
    return 'Zelle Transfer';
  }
  if (upperDesc.includes('WIX')) return 'Wix Payments';
  if (upperDesc.includes('PAYPAL')) return 'PayPal';
  if (upperDesc.includes('CASHAPP') || upperDesc.includes('CASH APP')) return 'CashApp';

  return cleanDesc.replace(/^(DEBIT|CREDIT|ACH|PREAUTHORIZED|WD)\s+/i, '').trim() || 'Bank Transaction';
}

export function TransactionHistory({ transactions, balance, onImport, onUpdateBalance }: HistoryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [showReport, setShowReport] = useState(false);

  const monthOptions = useMemo(() => getMonthOptions(transactions), [transactions]);

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.APPROVED: return 'bg-emerald-100 text-emerald-800';
      case TransactionStatus.REJECTED: return 'bg-rose-100 text-rose-800';
      default: return 'bg-amber-100 text-amber-800';
    }
  };

  const getSourceColor = (source: PaymentSource | undefined) => {
    switch (source) {
      case 'Wix Payments': return 'bg-purple-100 text-purple-700';
      case 'Zelle': return 'bg-violet-100 text-violet-700';
      case 'CashApp': return 'bg-green-100 text-green-700';
      case 'PayPal': return 'bg-blue-100 text-blue-700';
      case 'Venmo': return 'bg-cyan-100 text-cyan-700';
      case 'Check': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let start = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') inQuotes = !inQuotes;
      else if (line[i] === ',' && !inQuotes) {
        result.push(line.substring(start, i));
        start = i + 1;
      }
    }
    result.push(line.substring(start));
    return result.map(s => {
      s = s.trim();
      if (s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1).trim();
      return s;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n');
        const newTransactions: Transaction[] = [];
        let latestBalance = -1;
        let latestDateVal = 0;

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i].trim();
          if (!row) continue;
          const cols = parseCSVLine(row);
          if (cols.length < 5) continue;

          const dateStr = cols[1];
          const description = cols[3];
          const debitStr = cols[4];
          const creditStr = cols[5];
          const balanceStr = cols[7];
          const classification = cols[8];

          let formattedDate = new Date().toISOString().split('T')[0];
          let timestamp = 0;
          try {
            if (dateStr) {
              const d = new Date(dateStr);
              formattedDate = d.toISOString().split('T')[0];
              timestamp = d.getTime();
            }
          } catch {}

          let amount = 0;
          let type: 'EXPENSE' | 'INCOME' = 'EXPENSE';
          if (creditStr && parseFloat(creditStr) > 0) {
            amount = parseFloat(creditStr);
            type = 'INCOME';
          } else if (debitStr && parseFloat(debitStr) > 0) {
            amount = parseFloat(debitStr);
            type = 'EXPENSE';
          }

          if (balanceStr) {
            const b = parseFloat(balanceStr);
            if (!isNaN(b) && timestamp >= latestDateVal) {
              latestBalance = b;
              latestDateVal = timestamp;
            }
          }

          const paymentSource = detectPaymentSource(description);
          let category = detectCategory(description, type);
          if (classification) {
            const cleanClass = classification.replace(/&amp;/g, '&');
            if (CATEGORIES.includes(cleanClass as typeof CATEGORIES[number])) {
              category = cleanClass;
            }
          }

          if (amount > 0) {
            newTransactions.push({
              id: 'import-' + Date.now() + '-' + i,
              date: formattedDate,
              amount,
              merchant: extractMerchantName(description),
              category,
              description,
              type,
              status: TransactionStatus.APPROVED,
              submittedBy: 'Bank Import',
              paymentSource
            });
          }
        }

        if (newTransactions.length > 0 && onImport) {
          onImport(newTransactions);
          if (latestBalance !== -1 && onUpdateBalance) onUpdateBalance(latestBalance);
          setImportError(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          alert('Successfully imported ' + newTransactions.length + ' transactions.' + (latestBalance !== -1 ? ' Balance updated.' : ''));
        } else {
          setImportError("No valid transactions found.");
        }
      } catch (err) {
        console.error(err);
        setImportError("Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
  };

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(tx => {
        const date = new Date(tx.date);
        const monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
        return monthKey === selectedMonth;
      });
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.merchant.toLowerCase().includes(query) ||
        tx.description.toLowerCase().includes(query) ||
        tx.category.toLowerCase().includes(query) ||
        (tx.paymentSource?.toLowerCase().includes(query) ?? false)
      );
    }
    return filtered;
  }, [transactions, selectedMonth, searchQuery]);

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'INCOME' && t.status === TransactionStatus.APPROVED)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => (t.type === 'EXPENSE' || t.type === 'REIMBURSEMENT') && t.status === TransactionStatus.APPROVED)
    .reduce((sum, t) => sum + t.amount, 0);

  const selectedMonthLabel = monthOptions.find(m => m.value === selectedMonth)?.label || 'All Time';

  const handleExport = () => {
    const headers = ['Date', 'Merchant', 'Category', 'Payment Source', 'Type', 'Status', 'Amount'];
    const rows = filteredTransactions.map(tx => [
      tx.date,
      '"' + tx.merchant + '"',
      '"' + tx.category + '"',
      '"' + (tx.paymentSource || '') + '"',
      tx.type,
      tx.status,
      tx.type === 'INCOME' ? tx.amount : -tx.amount
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'abwa-douglas-' + (selectedMonth === 'all' ? 'all-time' : selectedMonth) + '-transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="space-y-6">
      {showReport && selectedMonth !== 'all' && (
        <MonthlyReport
          transactions={filteredTransactions}
          monthLabel={selectedMonthLabel}
          balance={balance}
          onClose={() => setShowReport(false)}
        />
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Transaction History</h2>
          <p className="text-slate-500">Audit trail of all chapter financials.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            <UploadCloud size={16} />
            <span>Import CSV</span>
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          {selectedMonth !== 'all' && (
            <button onClick={() => setShowReport(true)} className="flex items-center gap-2 rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800">
              <FileText size={16} />
              <span>Print Report</span>
            </button>
          )}
        </div>
      </div>

      {importError && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle size={16} />
          {importError}
        </div>
      )}

      <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700 border border-blue-100">
        <strong>CSV Import:</strong> Payment sources (Wix, Zelle, PayPal, CashApp, etc.) are auto-detected.
      </div>

      {selectedMonth !== 'all' && (
        <div className="rounded-xl border-2 border-rose-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-3">{selectedMonthLabel} Report</h3>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Transactions</p>
              <p className="text-lg font-bold text-slate-900">{filteredTransactions.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Total Income</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Total Expenses</p>
              <p className="text-lg font-bold text-rose-600">{formatCurrency(totalExpenses)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Net</p>
              <p className={`text-lg font-bold ${totalIncome - totalExpenses >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(totalIncome - totalExpenses)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500">
              {monthOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input type="text" placeholder="Search merchant, category, source..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-slate-300 pl-9 pr-4 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" />
          </div>
          <div className="text-sm text-slate-500">{filteredTransactions.length} transactions</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-4 font-medium">Date</th>
                <th className="px-4 py-4 font-medium">Merchant</th>
                <th className="px-4 py-4 font-medium">Category</th>
                <th className="px-4 py-4 font-medium">Source</th>
                <th className="px-4 py-4 font-medium">Status</th>
                <th className="px-4 py-4 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No transactions found</td></tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          {tx.type === 'INCOME' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                        </div>
                        <span className="font-medium text-slate-900">{tx.merchant}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{tx.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      {tx.paymentSource && (
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${getSourceColor(tx.paymentSource)}`}>{tx.paymentSource}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(tx.status)}`}>{tx.status}</span>
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 text-right font-bold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex justify-end gap-8 text-sm">
              <div><span className="text-slate-500">Total Income:</span><span className="ml-2 font-bold text-emerald-600">{formatCurrency(totalIncome)}</span></div>
              <div><span className="text-slate-500">Total Expenses:</span><span className="ml-2 font-bold text-rose-600">{formatCurrency(totalExpenses)}</span></div>
              <div><span className="text-slate-500">Net:</span><span className={`ml-2 font-bold ${totalIncome - totalExpenses >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(totalIncome - totalExpenses)}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
