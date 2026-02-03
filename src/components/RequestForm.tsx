'use client';

import { useState } from 'react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_SOURCES, Transaction, TransactionStatus, TransactionType, PaymentSource, Committee } from '@/types';
import { DollarSign, Calendar, Tag, FileText, CreditCard, Users } from 'lucide-react';

interface RequestFormProps {
  onSubmit: (transaction: Transaction) => void;
  onCancel: () => void;
  userName: string;
  isTreasurer: boolean;
  committees?: Committee[];
}

export function RequestForm({ onSubmit, onCancel, userName, isTreasurer, committees = [] }: RequestFormProps) {
  const [formData, setFormData] = useState({
    amount: '',
    merchant: '',
    date: new Date().toISOString().split('T')[0],
    category: EXPENSE_CATEGORIES[0] as string,
    description: '',
    type: 'REIMBURSEMENT' as TransactionType,
    submittedBy: userName,
    paymentSource: 'Other' as PaymentSource,
    committeeId: ''
  });

  // Get appropriate categories based on transaction type
  const currentCategories = formData.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'type') {
      // Reset category when type changes to ensure valid category
      const newType = value as TransactionType;
      const newCategories = newType === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      setFormData(prev => ({ ...prev, type: newType, category: newCategories[0] as string }));
    } else if (name === 'paymentSource') {
      setFormData(prev => ({ ...prev, paymentSource: value as PaymentSource }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCommittee = committees.find(c => c.id === formData.committeeId);
    const newTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      amount: parseFloat(formData.amount),
      merchant: formData.merchant,
      date: formData.date,
      category: formData.category,
      description: formData.description,
      type: formData.type,
      status: TransactionStatus.PENDING,
      submittedBy: formData.submittedBy,
      paymentSource: formData.paymentSource,
      committeeId: formData.committeeId || undefined,
      committeeName: selectedCommittee?.name
    };
    onSubmit(newTransaction);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          {isTreasurer ? 'Record Transaction' : 'Submit Request'}
        </h2>
        <p className="text-slate-500">
          {isTreasurer
            ? 'Enter checks written, payments made, or expected deposits. These will show as outstanding until cleared.'
            : 'Submit a reimbursement request or record a payment received. The treasurer will review and process your request.'
          }
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Transaction Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="REIMBURSEMENT">Reimbursement</option>
                  <option value="EXPENSE">Direct Payment (Expense)</option>
                  <option value="INCOME">Deposit (Income)</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                    className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Category</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    {currentCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Payment Method / Source</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <select
                  name="paymentSource"
                  value={formData.paymentSource}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  {PAYMENT_SOURCES.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {formData.type === 'INCOME' ? 'How payment was received' : 'How payment was made'}
              </p>
            </div>

            {/* Committee Selection - only show for expenses/reimbursements and if committees exist */}
            {committees.length > 0 && formData.type !== 'INCOME' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Committee (Optional)</label>
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <select
                    name="committeeId"
                    value={formData.committeeId}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="">No committee (General)</option>
                    {committees.map(committee => (
                      <option key={committee.id} value={committee.id}>{committee.name}</option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Assign this expense to a committee budget
                </p>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Payee / Merchant</label>
              <input
                type="text"
                name="merchant"
                value={formData.merchant}
                onChange={handleInputChange}
                placeholder="e.g., Staples, Catering Co."
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Description / Purpose</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-slate-400" size={16} />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  required
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  placeholder="Brief details about the expense..."
                />
              </div>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              <strong>Note:</strong> {isTreasurer
                ? 'This transaction will appear as "Outstanding" until it clears on your bank statement. When you import your bank CSV, matching transactions will be auto-reconciled.'
                : 'Your request will be submitted to the Treasurer for review and approval.'
              }
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-rose-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-rose-800 focus:outline-none focus:ring-4 focus:ring-rose-300"
              >
                {isTreasurer ? 'Record Transaction' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
