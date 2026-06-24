/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string; // usually same as username or email
  username: string;
  email: string;
  fullName: string;
  password?: string;
  avatarBg?: string; // Hex or tailwind class for avatar background
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  type: TransactionType;
  category: string; // For income: source (Gaji, Bisnis, dsb). For expense: Makanan, Transportasi, dsb.
  method?: string; // For expense: Cash, Transfer, E-wallet
  purpose?: string; // For expense: used for what
  notes?: string;
}

export interface SavingsTarget {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentProgress: number;
  targetDate?: string;
}

export interface FinancialAlert {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'success';
  message: string;
  date: string;
}

export type ViewType = 
  | 'dashboard' 
  | 'income' 
  | 'expense' 
  | 'transactions' 
  | 'reports' 
  | 'targets' 
  | 'profile';
