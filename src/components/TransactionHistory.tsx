'use client';

import { useRef, useState } from 'react';
import { Transaction, TransactionStatus, CATEGORIES } from '@/types';
import { Download, Search, Filter, UploadCloud, AlertCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface HistoryProps {
  transactions: Transaction[];
  onImport?: (transactions: Transaction[]) => void;
  onUpdateBalance?: (balance: number) => void;
}

export function TransactionHistory({ transactions, onImport, onUpdateBalance }: HistoryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.APPROVED: return 'bg-emerald-100 text-emerald-800';
      case TransactionStatus.REJECTED: return 'bg-rose-100 text-rose-800';
      default: return 'bg-amber-100 text-amber-800';
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let start = 0;
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes;
      } else if (line[i] === ',' && !inQuotes) {
        result.push(line.substring(start, i));
        start = i + 1;
      }
    }
    result.push(line.substring(start));

    return result.map(s => {
      s = s.trim();
      if (s.startsWith('"') && s.endsWith('"')) {
        return s.slice(1, -1).trim();
      }
      return s;
    });
  };

  const extractMerchantName = (description: string): string => {
    if (!description) return 'Bank Transaction';
    const cleanDesc = description.trim();
    const upperDesc = cleanDesc.toUpperCase();

    if (upperDesc.includes('ZELLE')) {
      const match = cleanDesc.match(/(?:DEBIT\s+)?ZELLE\s+([A-Za-z\s]+?)\s+\d/i);

      if (match && match[1]) {
        const extractedName = match[1].trim();
        if (extractedName.toUpperCase() !== 'TRANSFER' && extractedName.length > 1) {
          return `${extractedName} (Zelle)`;
        }
      }
      return 'Zelle Transfer';
    }

    return cleanDesc;
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

          let category = 'Misc';
          if (classification) {
             const cleanClass = classification.replace(/&amp;/g, '&');
             if (CATEGORIES.includes(cleanClass as typeof CATEGORIES[number])) {
                category = cleanClass;
             } else if (cleanClass === 'Income') {
                category = 'Operations';
             } else {
                category = cleanClass || 'Misc';
             }
          }

          if (amount > 0) {
            newTransactions.push({
                id: `import-${Date.now()}-${i}`,
                date: formattedDate,
                amount: amount,
                merchant: extractMerchantName(description),
                category: category,
                description: classification ? `Classified: ${classification}` : 'Imported from Bank',
                type: type,
                status: TransactionStatus.APPROVED,
                submittedBy: 'Bank Import'
            });
          }
        }

        if (newTransactions.length > 0 && onImport) {
          onImport(newTransactions);

          if (latestBalance !== -1 && onUpdateBalance) {
             onUpdateBalance(latestBalance);
          }

          setImportError(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          alert(`Successfully imported ${newTransactions.length} transactions. ${latestBalance !== -1 ? 'Balance updated.' : ''}`);
        } else {
          setImportError("No valid transactions found. Please ensure the CSV format matches your bank statement.");
        }
      } catch (err) {
        console.error(err);
        setImportError("Failed to parse CSV file. Please check the format.");
      }
    };
    reader.readAsText(file);
  };

  const filteredTransactions = transactions.filter(tx => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tx.merchant.toLowerCase().includes(query) ||
      tx.description.toLowerCase().includes(query) ||
      tx.category.toLowerCase().includes(query)
    );
  });

  const handleExport = () => {
    const headers = ['Date', 'Merchant', 'Category', 'Description', 'Type', 'Status', 'Amount'];
    const rows = transactions.map(tx => [
      tx.date,
      tx.merchant,
      tx.category,
      tx.description,
      tx.type,
      tx.status,
      tx.type === 'INCOME' ? tx.amount : -tx.amount
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abwa-douglas-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Transaction History</h2>
          <p className="text-slate-500">Audit trail of all chapter financials.</p>
        </div>
        <div className="flex gap-2">
           <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
           />
           <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
            <UploadCloud size={16} />
            <span>Import Bank Statement</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {importError && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle size={16} />
          {importError}
        </div>
      )}

      <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700 border border-blue-100">
        <strong>Bank Import Ready:</strong> Upload your .CSV file to automatically populate transactions and update the dashboard balance.
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search merchant, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 pl-9 pr-4 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Merchant / Payee</th>
                <th className="px-6 py-4 font-medium">Category / Notes</th>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50">
                  <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                    {new Date(tx.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                        ${tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {tx.type === 'INCOME' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{tx.merchant}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex w-fit items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {tx.category}
                      </span>
                      <span className="text-xs text-slate-500 truncate max-w-[200px]" title={tx.description}>
                        {tx.description}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                    {tx.submittedBy}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className={`whitespace-nowrap px-6 py-4 text-right font-bold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
