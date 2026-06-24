/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Transaction, SavingsTarget } from '../types';
import { auth } from './firebase';
import { dbSaveUserProfile, dbSaveTransaction, dbDeleteTransaction, dbSaveTarget, dbDeleteTarget } from './firebaseStorage';

// Load all users from LocalStorage
export function getUsers(): User[] {
  const usersJson = localStorage.getItem('finance_users');
  return usersJson ? JSON.parse(usersJson) : [];
}

// Save all users
export function saveUsers(users: User[]): void {
  localStorage.setItem('finance_users', JSON.stringify(users));
}

// Current logged in user
export function getCurrentUser(): User | null {
  const userJson = localStorage.getItem('finance_current_user');
  if (!userJson) return null;
  
  // Re-read from full users array to ensure we have the latest updated info
  const partialUser = JSON.parse(userJson) as User;
  const allUsers = getUsers();
  const found = allUsers.find(u => {
    if (u.id === partialUser.id) return true;
    if (u.username && partialUser.username) {
      return u.username.toLowerCase() === partialUser.username.toLowerCase();
    }
    return false;
  });
  return found || partialUser;
}

// Set logged in user
export function setCurrentUser(user: User | null): void {
  if (user) {
    localStorage.setItem('finance_current_user', JSON.stringify(user));
    
    // Sync profile to Firestore if signed in
    if (auth.currentUser && auth.currentUser.uid === user.id) {
      dbSaveUserProfile(user).catch(err => {
        console.error("Failed to sync profile update to Firestore:", err);
      });
    }
  } else {
    localStorage.removeItem('finance_current_user');
  }
}

// Save dark mode preference globally or per-user
export function getDarkModeTheme(username?: string): boolean {
  const key = username ? `theme_dark_${username}` : 'theme_dark_global';
  const val = localStorage.getItem(key);
  return val === 'true';
}

export function setDarkModeTheme(active: boolean, username?: string): void {
  const key = username ? `theme_dark_${username}` : 'theme_dark_global';
  localStorage.setItem(key, String(active));
}

// --- USER SPECIFIC TRANSACTIONS CRUD ---
export function getUserTransactions(userId: string): Transaction[] {
  if (!userId) return [];
  const key = `transactions_${String(userId).toLowerCase()}`;
  const json = localStorage.getItem(key);
  return json ? JSON.parse(json) : [];
}

export function saveUserTransactions(userId: string, transactions: Transaction[]): void {
  if (!userId) return;
  const key = `transactions_${String(userId).toLowerCase()}`;
  
  // Diff changes to sync with Firestore
  const oldJson = localStorage.getItem(key);
  const oldTransactions: Transaction[] = oldJson ? JSON.parse(oldJson) : [];
  
  localStorage.setItem(key, JSON.stringify(transactions));
  
  // If signed in with Firebase, sync to Firestore in the background
  if (auth.currentUser && auth.currentUser.uid === userId) {
    const newDocIds = new Set(transactions.map(t => t.id));
    const deleted = oldTransactions.filter(t => !newDocIds.has(t.id));
    
    deleted.forEach(async (t) => {
      try {
        await dbDeleteTransaction(t.id);
      } catch (e) {
        console.error("Cloud delete sync failed:", e);
      }
    });

    transactions.forEach(async (t) => {
      const oldMatch = oldTransactions.find(o => o.id === t.id);
      const isChanged = !oldMatch || JSON.stringify(oldMatch) !== JSON.stringify(t);
      if (isChanged) {
        try {
          await dbSaveTransaction({
            ...t,
            userId: auth.currentUser!.uid
          });
        } catch (e) {
          console.error("Cloud save sync failed:", e);
        }
      }
    });
  }
}

// --- USER SPECIFIC SAVINGS TARGET CRUD ---
export function getUserTargets(userId: string): SavingsTarget[] {
  if (!userId) return [];
  const key = `targets_${String(userId).toLowerCase()}`;
  const json = localStorage.getItem(key);
  return json ? JSON.parse(json) : [];
}

export function saveUserTargets(userId: string, targets: SavingsTarget[]): void {
  if (!userId) return;
  const key = `targets_${String(userId).toLowerCase()}`;
  
  // Diff changes to sync with Firestore
  const oldJson = localStorage.getItem(key);
  const oldTargets: SavingsTarget[] = oldJson ? JSON.parse(oldJson) : [];
  
  localStorage.setItem(key, JSON.stringify(targets));
  
  // If signed in with Firebase, sync to Firestore
  if (auth.currentUser && auth.currentUser.uid === userId) {
    const newDocIds = new Set(targets.map(t => t.id));
    const deleted = oldTargets.filter(t => !newDocIds.has(t.id));
    
    deleted.forEach(async (t) => {
      try {
        await dbDeleteTarget(t.id);
      } catch (e) {
        console.error("Cloud target delete sync failed:", e);
      }
    });

    targets.forEach(async (t) => {
      const oldMatch = oldTargets.find(o => o.id === t.id);
      const isChanged = !oldMatch || JSON.stringify(oldMatch) !== JSON.stringify(t);
      if (isChanged) {
        try {
          await dbSaveTarget({
            ...t,
            userId: auth.currentUser!.uid
          });
        } catch (e) {
          console.error("Cloud target save sync failed:", e);
        }
      }
    });
  }
}

// Helper to format currency Rp (Indonesian Rupiah)
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

