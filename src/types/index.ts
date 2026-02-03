export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export type TransactionType = 'EXPENSE' | 'INCOME' | 'REIMBURSEMENT';

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
}

export type ViewState = 'dashboard' | 'request' | 'history';

export const CATEGORIES = [
  'Meeting Expenses',
  'Operations',
  'Membership Dues',
  'Fundraising',
  'Speaker Gifts',
  'Travel/Conferences',
  'Scholarships',
  'Transfer',
  'Electronics & Software',
  'Fees & Charges',
  'Business Services',
  'Groceries',
  'Shopping',
  'Misc'
] as const;
