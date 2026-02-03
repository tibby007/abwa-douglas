export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export type TransactionType = 'EXPENSE' | 'INCOME' | 'REIMBURSEMENT';

// Payment sources/methods
export const PAYMENT_SOURCES = [
  'Wix Payments',
  'Zelle',
  'CashApp',
  'PayPal',
  'Venmo',
  'Check',
  'Cash',
  'Bank Transfer',
  'Credit Card',
  'Debit Card',
  'Other'
] as const;

export type PaymentSource = typeof PAYMENT_SOURCES[number];

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  merchant: string;
  category: string;
  description: string;
  type: TransactionType;
  status: TransactionStatus;
  submittedBy: string;
  paymentSource?: PaymentSource;
  committeeId?: string;
  committeeName?: string;
}

export interface Committee {
  id: string;
  name: string;
  annualBudget: number;
  description?: string;
  chairName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ViewState = 'dashboard' | 'request' | 'history' | 'budgets';

// Expense categories
export const EXPENSE_CATEGORIES = [
  'Meeting Expenses',
  'Operations',
  'Marketing & Promotions',
  'Speaker Gifts',
  'Travel/Conferences',
  'Scholarships & Awards',
  'Supplies & Materials',
  'Venue Rental',
  'Catering & Food',
  'Electronics & Software',
  'Subscriptions',
  'Printing & Stationery',
  'Bank Fees',
  'Processing Fees',
  'Insurance',
  'Donations Given',
  'Refunds Issued',
  'Misc Expense'
] as const;

// Income categories
export const INCOME_CATEGORIES = [
  'Membership Dues',
  'Event Registration',
  'Sponsorship',
  'Donations Received',
  'Fundraising',
  'Merchandise Sales',
  'Workshop Fees',
  'Advertising Revenue',
  'Interest Income',
  'Refunds Received',
  'Misc Income'
] as const;

// Combined for backwards compatibility
export const CATEGORIES = [
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
  'Transfer',
  'Uncategorized'
] as const;
