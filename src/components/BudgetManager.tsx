'use client';

import { useState } from 'react';
import { Committee, Transaction, TransactionStatus } from '@/types';
import { PieChart, Plus, Edit2, Trash2, X, Check, DollarSign, Users } from 'lucide-react';

interface BudgetManagerProps {
  committees: Committee[];
  transactions: Transaction[];
  isTreasurer: boolean;
  onAddCommittee: (committee: Omit<Committee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateCommittee: (id: string, updates: Partial<Committee>) => Promise<void>;
  onDeleteCommittee: (id: string) => Promise<void>;
}

export function BudgetManager({
  committees,
  transactions,
  isTreasurer,
  onAddCommittee,
  onUpdateCommittee,
  onDeleteCommittee
}: BudgetManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    annualBudget: '',
    description: '',
    chairName: ''
  });

  // Calculate spent amount per committee from approved transactions
  const getSpentByCommittee = (committeeId: string): number => {
    return transactions
      .filter(t =>
        t.committeeId === committeeId &&
        t.status === TransactionStatus.APPROVED &&
        (t.type === 'EXPENSE' || t.type === 'REIMBURSEMENT')
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Calculate totals
  const totalBudget = committees.reduce((sum, c) => sum + c.annualBudget, 0);
  const totalSpent = committees.reduce((sum, c) => sum + getSpentByCommittee(c.id), 0);
  const totalRemaining = totalBudget - totalSpent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      await onUpdateCommittee(editingId, {
        name: formData.name,
        annualBudget: parseFloat(formData.annualBudget) || 0,
        description: formData.description,
        chairName: formData.chairName
      });
      setEditingId(null);
    } else {
      await onAddCommittee({
        name: formData.name,
        annualBudget: parseFloat(formData.annualBudget) || 0,
        description: formData.description,
        chairName: formData.chairName,
        isActive: true
      });
      setShowAddForm(false);
    }

    setFormData({ name: '', annualBudget: '', description: '', chairName: '' });
  };

  const startEdit = (committee: Committee) => {
    setEditingId(committee.id);
    setFormData({
      name: committee.name,
      annualBudget: committee.annualBudget.toString(),
      description: committee.description || '',
      chairName: committee.chairName || ''
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ name: '', annualBudget: '', description: '', chairName: '' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the "${name}" committee? This will not delete associated transactions.`)) {
      await onDeleteCommittee(id);
    }
  };

  const getProgressColor = (spent: number, budget: number): string => {
    if (budget === 0) return 'bg-slate-200';
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getProgressWidth = (spent: number, budget: number): string => {
    if (budget === 0) return '0%';
    const percentage = Math.min((spent / budget) * 100, 100);
    return `${percentage}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Committee Budgets</h2>
          <p className="text-slate-500">Track spending against annual budget allocations</p>
        </div>
        {isTreasurer && !showAddForm && !editingId && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-800"
          >
            <Plus size={16} />
            Add Committee
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <DollarSign className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Budget</p>
              <p className="text-xl font-bold text-slate-900">${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <PieChart className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Spent</p>
              <p className="text-xl font-bold text-slate-900">${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${totalRemaining >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
              <DollarSign className={totalRemaining >= 0 ? 'text-emerald-600' : 'text-red-600'} size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Remaining</p>
              <p className={`text-xl font-bold ${totalRemaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ${Math.abs(totalRemaining).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                {totalRemaining < 0 && ' over'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && isTreasurer && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {editingId ? 'Edit Committee' : 'Add New Committee'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Committee Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  placeholder="e.g., Programs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Annual Budget</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input
                    type="number"
                    value={formData.annualBudget}
                    onChange={(e) => setFormData(prev => ({ ...prev, annualBudget: e.target.value }))}
                    step="0.01"
                    min="0"
                    className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chair Name (Optional)</label>
                <input
                  type="text"
                  value={formData.chairName}
                  onChange={(e) => setFormData(prev => ({ ...prev, chairName: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  placeholder="Committee chair"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  placeholder="Brief description"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800"
              >
                <Check size={16} />
                {editingId ? 'Save Changes' : 'Add Committee'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Committee List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Users size={16} />
            <span>All Committees ({committees.length})</span>
          </div>
        </div>

        {committees.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Users size={40} className="mx-auto mb-3 text-slate-300" />
            <p>No committees set up yet.</p>
            {isTreasurer && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-3 text-rose-700 hover:text-rose-800 font-medium"
              >
                Add your first committee
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {committees.map(committee => {
              const spent = getSpentByCommittee(committee.id);
              const remaining = committee.annualBudget - spent;
              const isEditing = editingId === committee.id;

              return (
                <div key={committee.id} className={`p-5 ${isEditing ? 'bg-rose-50' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-slate-900">{committee.name}</h4>
                      {committee.chairName && (
                        <p className="text-sm text-slate-500">Chair: {committee.chairName}</p>
                      )}
                      {committee.description && (
                        <p className="text-sm text-slate-400">{committee.description}</p>
                      )}
                    </div>
                    {isTreasurer && !isEditing && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(committee)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(committee.id, committee.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getProgressColor(spent, committee.annualBudget)}`}
                        style={{ width: getProgressWidth(spent, committee.annualBudget) }}
                      />
                    </div>
                  </div>

                  {/* Budget Details */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-slate-500">
                        Budget: <span className="font-medium text-slate-700">${committee.annualBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </span>
                      <span className="text-slate-500">
                        Spent: <span className="font-medium text-slate-700">${spent.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </span>
                    </div>
                    <span className={`font-medium ${remaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {remaining >= 0 ? `$${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })} remaining` : `$${Math.abs(remaining).toLocaleString('en-US', { minimumFractionDigits: 2 })} over budget`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
