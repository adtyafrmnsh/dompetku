/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Transaction } from '../types';
import { getUserTransactions, saveUserTransactions, formatRupiah } from '../utils/storage';
import { TrendingUp, Plus, Edit2, Trash2, Calendar, FileText, CheckCircle, HelpCircle } from 'lucide-react';

interface PendapatanViewProps {
  user: User;
  onTransactionChange: () => void;
}

const CATEGORIES_PENDAPATAN = [
  'Gaji',
  'Bisnis',
  'Freelance',
  'Investasi',
  'Bonus',
  'Komisi',
  'Hadiah',
  'Lainnya'
];

export default function PendapatanView({ user, onTransactionChange }: PendapatanViewProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => 
    getUserTransactions(user.id).filter(t => t.type === 'income')
  );

  // Form State
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Gaji');
  const [notes, setNotes] = useState('');
  
  // Edit variables
  const [editId, setEditId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: '' });

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setCategory('Gaji');
    setNotes('');
    setEditId(null);
  };

  const showFeedback = (text: string, type: 'success' | 'error') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => {
      setFeedbackMsg({ text: '', type: '' });
    }, 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const numericAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showFeedback('Masukkan jumlah pendapatan yang valid (> 0).', 'error');
      return;
    }

    if (!date) {
      showFeedback('Tanggal wajib diisi.', 'error');
      return;
    }

    const allUserTransactions = getUserTransactions(user.id);

    if (editId) {
      // Edit Mode
      const updatedAll = allUserTransactions.map(t => {
        if (t.id === editId) {
          return {
            ...t,
            date,
            amount: numericAmount,
            category,
            notes: notes.trim(),
          };
        }
        return t;
      });
      saveUserTransactions(user.id, updatedAll);
      showFeedback('Pendapatan berhasil diperbarui!', 'success');
    } else {
      // Add Mode
      const newTx: Transaction = {
        id: 'tx_' + Math.random().toString(36).substring(2, 11),
        userId: user.id,
        date,
        amount: numericAmount,
        type: 'income',
        category,
        notes: notes.trim()
      };
      allUserTransactions.unshift(newTx);
      saveUserTransactions(user.id, allUserTransactions);
      showFeedback('Pendapatan berhasil ditambahkan!', 'success');
    }

    // Refresh views
    const freshTransactions = getUserTransactions(user.id).filter(t => t.type === 'income');
    setTransactions(freshTransactions);
    resetForm();
    onTransactionChange();
  };

  const handleEditInit = (tx: Transaction) => {
    setEditId(tx.id);
    setDate(tx.date);
    setAmount(String(tx.amount));
    setCategory(tx.category);
    setNotes(tx.notes || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    const allUserTransactions = getUserTransactions(user.id);
    const filtered = allUserTransactions.filter(t => t.id !== id);
    saveUserTransactions(user.id, filtered);
    
    const freshTransactions = filtered.filter(t => t.type === 'income');
    setTransactions(freshTransactions);
    showFeedback('Pendapatan berhasil dihapus.', 'success');
    onTransactionChange();
    
    if (editId === id) {
      resetForm();
    }
  };

  const totalIncome = transactions.reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 transition-all">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Pencatatan Pendapatan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Catat pemasukan kas Anda dari gaji, bisnis, maupun hadiah secara rapi.</p>
        </div>
        <div className="flex flex-col shrink-0 text-right bg-emerald-50 dark:bg-emerald-950/20 px-5 py-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Total Pendapatan Anda</span>
          <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400" id="income-total-val">
            {formatRupiah(totalIncome)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Card */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <form onSubmit={handleSave} className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-slate-700 pb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              {editId ? 'Ubah Catatan Pendapatan' : 'Tambah Pendapatan Baru'}
            </h2>

            {feedbackMsg.text && (
              <div 
                className={`p-4 rounded-xl text-sm border flex items-center gap-2 ${
                  feedbackMsg.type === 'success' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' 
                    : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50'
                }`}
              >
                <span>{feedbackMsg.text}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Tanggal Pemasukan
              </label>
              <div className="relative">
                <input
                  id="income-date"
                  type="date"
                  required
                  className="appearance-none rounded-xl block w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Jumlah Pendapatan (Rp)
              </label>
              <input
                id="income-amount"
                type="number"
                required
                min="1"
                placeholder="Misal: 5000000"
                className="appearance-none rounded-xl block w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <span className="text-[11px] text-gray-500 mt-1 block font-medium">
                Konfirmasi Pembacaan: {amount ? formatRupiah(parseFloat(amount) || 0) : 'Rp0'}
              </span>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Asal-Usul / Kategori
              </label>
              <select
                id="income-category"
                className="rounded-xl block w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES_PENDAPATAN.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Deskripsi / Keterangan
              </label>
              <textarea
                id="income-notes"
                rows={3}
                placeholder="Contoh: Gaji bulanan kantor, Bonus penjualan, Freelance project"
                className="appearance-none rounded-xl block w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all resize-none"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-50 dark:border-slate-700/50 mt-4">
              <button
                id="btn-save-income"
                type="submit"
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-sm transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                {editId ? 'Perbarui Catatan' : 'Simpan Transaksi'}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl text-sm transition cursor-pointer"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Mini List Income */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 shadow-xs">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Catatan Pendapatan Riwayat</h3>
          
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-gray-100 dark:border-slate-700 rounded-2xl">
              <HelpCircle className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold text-center">Belum ada transaksi pendapatan.</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs text-center mt-1">Gunakan formulir disamping untuk mencatat pemasukan pertama Anda.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {transactions.map((tx) => (
                <div 
                  key={tx.id} 
                  className="p-4 bg-gray-50 dark:bg-slate-850/60 rounded-xl border border-gray-100 dark:border-slate-700/50 flex items-center justify-between gap-3 group hover:border-emerald-500/20 dark:hover:border-emerald-500/20 transition-all shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {tx.notes || tx.category}
                        </span>
                        <span className="py-0.5 px-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] rounded-full font-bold">
                          {tx.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{tx.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                      +{formatRupiah(tx.amount)}
                    </span>
                    <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button
                        onClick={() => handleEditInit(tx)}
                        className="p-1.5 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg border border-gray-100 dark:border-slate-650 text-gray-550 dark:text-gray-305 transition hover:text-emerald-500"
                        title="Edit Catatan"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="p-1.5 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg border border-gray-100 dark:border-slate-650 text-gray-550 dark:text-rose-400 transition"
                        title="Hapus Catatan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
