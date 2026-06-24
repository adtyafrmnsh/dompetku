/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { User, Transaction, SavingsTarget } from '../types';

// --- USER PROFILE OPERATIONS ---

/**
 * Creates or updates user profile in Firestore
 */
export async function dbSaveUserProfile(user: User): Promise<void> {
  const path = `users/${user.id}`;
  try {
    const userDocRef = doc(db, 'users', user.id);
    await setDoc(userDocRef, {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      avatarBg: user.avatarBg || 'bg-emerald-500'
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Fetches user profile from Firestore by UID
 */
export async function dbGetUserProfile(uid: string): Promise<User | null> {
  const path = `users/${uid}`;
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) return null;
    return snap.data() as User;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

// --- TRANSACTIONS OPERATIONS ---

/**
 * Fetch all transactions for a specific authenticated user
 */
export async function dbGetTransactions(uid: string): Promise<Transaction[]> {
  const path = 'transactions';
  try {
    const q = query(collection(db, 'transactions'), where('userId', '==', uid));
    const snap = await getDocs(q);
    const items: Transaction[] = [];
    snap.forEach((docSnap) => {
      items.push(docSnap.data() as Transaction);
    });
    // Sort transactions by date descending (latest first)
    return items.sort((a, b) => b.date.localeCompare(a.date));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

/**
 * Save single transaction to Firestore
 */
export async function dbSaveTransaction(tx: Transaction): Promise<void> {
  const path = `transactions/${tx.id}`;
  try {
    const docRef = doc(db, 'transactions', tx.id);
    await setDoc(docRef, {
      id: tx.id,
      userId: tx.userId,
      date: tx.date,
      amount: Number(tx.amount),
      type: tx.type,
      category: tx.category,
      method: tx.method || '',
      purpose: tx.purpose || '',
      notes: tx.notes || ''
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Delete a transaction from Firestore
 */
export async function dbDeleteTransaction(txId: string): Promise<void> {
  const path = `transactions/${txId}`;
  try {
    const docRef = doc(db, 'transactions', txId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// --- SAVINGS TARGETS OPERATIONS ---

/**
 * Fetch all savings targets for a specific authenticated user
 */
export async function dbGetTargets(uid: string): Promise<SavingsTarget[]> {
  const path = 'targets';
  try {
    const q = query(collection(db, 'targets'), where('userId', '==', uid));
    const snap = await getDocs(q);
    const items: SavingsTarget[] = [];
    snap.forEach((docSnap) => {
      items.push(docSnap.data() as SavingsTarget);
    });
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

/**
 * Save single savings target to Firestore
 */
export async function dbSaveTarget(target: SavingsTarget): Promise<void> {
  const path = `targets/${target.id}`;
  try {
    const docRef = doc(db, 'targets', target.id);
    await setDoc(docRef, {
      id: target.id,
      userId: target.userId,
      name: target.name,
      targetAmount: Number(target.targetAmount),
      currentProgress: Number(target.currentProgress),
      targetDate: target.targetDate || ''
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Delete a savings target from Firestore
 */
export async function dbDeleteTarget(targetId: string): Promise<void> {
  const path = `targets/${targetId}`;
  try {
    const docRef = doc(db, 'targets', targetId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
