
export type TransactionType = 'INCOME' | 'EXPENSE';
export type FixedBillStatus = 'PAID' | 'UNPAID';
export type ForecastType = 'EXPECTED_INCOME' | 'EXPECTED_EXPENSE';
export type ForecastStatus = 'PENDING' | 'RECEIVED' | 'PAID';

export interface Transaction {
  id: string;
  type: TransactionType;
  value: number;
  description: string;
  date: string; // ISO String YYYY-MM-DD
  category: string;
  relatedCardId?: string; // If present, it belongs to a credit card bill
  billingMonth?: string; // Formato YYYY-MM
}

export interface FixedBill {
  id: string;
  name: string;
  baseValue: number;
  dueDay: number;
  category: string;
  isRecurring: boolean;
  startMonth: string; // Formato YYYY-MM
  endedAt?: string;   // Formato YYYY-MM
  paidMonths: string[]; // Chaves no formato YYYY-MM
  skippedMonths: string[]; // Chaves no formato YYYY-MM para exclusão pontual
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  dueDay: number;
  bestPurchaseDay: number;
  color: string;
  brand: 'visa' | 'mastercard' | 'other';
  paidInvoices: string[]; // Array of "YYYY-MM" strings indicating paid invoices
}

export interface Forecast {
  id: string;
  type: ForecastType;
  value: number;
  expectedDate: string;
  description: string;
  isRecurring: boolean;
  status: ForecastStatus;
  startMonth: string; // Formato YYYY-MM
  endedAt?: string;   // Formato YYYY-MM
  skippedMonths: string[]; // Chaves no formato YYYY-MM
}

export interface BudgetLimit {
  id: string;
  category: string;
  monthlyLimit: number;
  spent: number; // Calculated on the fly usually, but storing for mock simplicity
}

export type EventSource = 'INTERNAL' | 'GOOGLE' | 'OUTLOOK';

export interface CalendarEvent {
  id: string;
  title: string;
  dateTime: string; // ISO String
  description?: string;
  location?: string;
  source: EventSource;
  color?: string; // Hex code or tailwind class reference
  category?: string; // Inferred by NLP
}

export interface CalendarConnection {
  id: string;
  accountName: string;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED';
  source: 'GOOGLE' | 'OUTLOOK';
  lastSyncDate: string;
}

export enum AppTab {
  CHAT = 'CHAT',
  FINANCE = 'FINANCE',
  AGENDA = 'AGENDA',
  PROFILE = 'PROFILE'
}
