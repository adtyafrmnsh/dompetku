/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { User, Transaction, TransactionType } from '../types';
import { getUserTransactions, saveUserTransactions, formatRupiah } from '../utils/storage';
import { 
  History, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Trash2, 
  Edit2, 
  Info, 
  Calendar, 
  Download, 
  X, 
  CheckCircle,
  HelpCircle,
  FileText
} from 'lucide-react';

interface TransaksiViewProps {
  user: User;
  onTransactionChange: () => void;
}

export default function TransaksiView({ user, onTransactionChange }: TransaksiViewProps) {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>(() => 
    getUserTransactions(user.id)
  );

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  
  // Modal states
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  
  // Feedback flags
  const [alertMsg, setAlertMsg] = useState('');

  // Categories lists combined
  const categories = useMemo(() => {
    const list = new Set<string>();
    allTransactions.forEach(t => {
      if (t.category) list.add(t.category);
    });
    return Array.from(list);
  }, [allTransactions]);

  // Handle transaction update
  const triggerRefresh = () => {
    const fresh = getUserTransactions(user.id);
    setAllTransactions(fresh);
    onTransactionChange();
  };

  // Filter logic
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(t => {
      // 1. Search term match
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = 
        t.category.toLowerCase().includes(searchLower) ||
        (t.notes && t.notes.toLowerCase().includes(searchLower)) ||
        (t.purpose && t.purpose.toLowerCase().includes(searchLower)) ||
        String(t.amount).includes(searchLower);

      // 2. Type filter
      const matchType = filterType === 'all' || t.type === filterType;

      // 3. Category filter
      const matchCategory = filterCategory === 'all' || t.category === filterCategory;

      // 4. Date filter
      const matchDate = !filterDate || t.date === filterDate;

      return matchSearch && matchType && matchCategory && matchDate;
    });
  }, [allTransactions, searchTerm, filterType, filterCategory, filterDate]);

  // DELETE handler
  const handleDelete = (id: string) => {
    const updated = allTransactions.filter(t => t.id !== id);
    saveUserTransactions(user.id, updated);
    setAllTransactions(updated);
    triggerRefresh();
    setAlertMsg('Transaksi berhasil dihapus');
    setTimeout(() => setAlertMsg(''), 3000);
  };

  // EDIT modal save handler
  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    if (editingTx.amount <= 0 || isNaN(editingTx.amount)) {
      setAlertMsg('Masukkan jumlah transaksi yang valid.');
      setTimeout(() => setAlertMsg(''), 3000);
      return;
    }

    const updated = allTransactions.map(t => {
      if (t.id === editingTx.id) {
        return editingTx;
      }
      return t;
    });

    saveUserTransactions(user.id, updated);
    setAllTransactions(updated);
    setEditingTx(null);
    triggerRefresh();
    setAlertMsg('Transaksi berhasil diperbarui');
    setTimeout(() => setAlertMsg(''), 3000);
  };

  // EXPORT TO CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      setAlertMsg('Tidak ada data transaksi untuk diekspor.');
      setTimeout(() => setAlertMsg(''), 3000);
      return;
    }

    const headers = ['Tanggal', 'Jenis', 'Kategori', 'Keterangan/Tujuan', 'Metode Bayar', 'Jumlah (Rp)', 'Catatan'];
    
    const rows = filteredTransactions.map(t => [
      t.date,
      t.type === 'income' ? 'Pendapatan' : 'Pengeluaran',
      t.category,
      t.type === 'income' ? (t.notes || '-') : (t.purpose || '-'),
      t.method || '-',
      t.amount,
      t.notes || '-'
    ]);

    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add file metadata at top
    csvContent += `LAPORAN KEUANGAN PRIBADI - DOMPETKU\n`;
    csvContent += `Nama Pengguna: ${user.fullName} (@${user.username})\n`;
    csvContent += `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}\n`;
    csvContent += `Filter Aktif: Tipe=${filterType}, Kategori=${filterCategory}\n\n`;

    csvContent += headers.join(',') + '\n';
    rows.forEach(r => {
      const cleanRow = r.map(val => {
        const textStr = String(val).replace(/"/g, '""');
        return textStr.includes(',') || textStr.includes('\n') ? `"${textStr}"` : textStr;
      });
      csvContent += cleanRow.join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Keuangan_Dompetku_${user.username}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // EXPORT/PRINT PDF via formatted printer-friendly frame
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Search & Export bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 transition-colors">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <History className="h-6 w-6 text-emerald-500" />
            Riwayat Transaksi
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gunakan filter dan pencarian untuk melacak arus kas keuangan Anda.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={handlePrintPDF}
            className="px-4 py-2 bg-slate-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-gray-700 dark:text-gray-300 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="h-4 w-4" />
            <span>Cetak PDF / Print</span>
          </button>
        </div>
      </div>

      {alertMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/50 text-sm flex items-center gap-2 animate-bounce">
          <CheckCircle className="h-4 w-4" />
          <span>{alertMsg}</span>
        </div>
      )}

      {/* FILTER & SEARCH PANEL */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-xs space-y-4 transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search bar input */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari transaksi (kategori, nominal, catatan)..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
            >
              <option value="all">Semua Tipe Transaksi</option>
              <option value="income">Pendapatan (+)</option>
              <option value="expense">Pengeluaran (-)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">Semua Kategori</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filter Panel */}
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <div className="flex items-center gap-2 text-sm text-gray-650 dark:text-gray-300">
            <Filter className="h-4 w-4 text-emerald-500" />
            <span className="font-semibold">Filter Tanggal Spesifik:</span>
          </div>
          <div>
            <input
              type="date"
              className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-gray-900 dark:text-white"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="text-xs text-rose-500 hover:underline cursor-pointer"
            >
              Hapus Filter Tanggal
            </button>
          )}
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left" id="transactions-table">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850 border-b border-gray-100 dark:border-slate-700 text-gray-700 dark:text-gray-350 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Tanggal</th>
                <th className="py-4 px-6">Tipe</th>
                <th className="py-4 px-6">Kategori</th>
                <th className="py-4 px-6">Keterangan</th>
                <th className="py-4 px-6">Jumlah (Rp)</th>
                <th className="py-4 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700 text-sm">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <HelpCircle className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400 font-semibold">Tidak ada transaksi ditemukan.</p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Coba ubah kriteria pencarian atau filter Anda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr 
                    key={tx.id} 
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-all group"
                  >
                    <td className="py-4 px-6 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {tx.type === 'income' ? (
                        <span className="inline-flex items-center gap-1 py-1 px-2.5 bg-emerald-50 dark:bg-emerald-950/45 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold">
                          <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                          Pendapatan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 py-1 px-2.5 bg-rose-50 dark:bg-rose-950/45 text-rose-600 dark:text-rose-400 rounded-full text-xs font-bold">
                          <ArrowDownLeft className="h-3.5 w-3.5 shrink-0" />
                          Pengeluaran
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="py-1 px-2.5 bg-slate-100 dark:bg-slate-700 font-semibold text-gray-800 dark:text-gray-305 text-xs rounded-lg">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 max-w-[200px] truncate font-medium text-gray-900 dark:text-white">
                      {tx.type === 'income' ? (tx.notes || 'Pemasukan Kas') : (tx.purpose || 'Belanjaan')}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`font-extrabold text-sm ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-1.5 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="p-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-gray-500 dark:text-gray-400 transition"
                          title="Detail Transaksi"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingTx(tx)}
                          className="p-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-gray-500 dark:text-gray-400 transition hover:text-emerald-500 dark:hover:text-emerald-400"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1.5 bg-gray-55 hover:bg-rose-50 dark:bg-slate-700 dark:hover:bg-rose-955 rounded-lg text-gray-500 dark:text-rose-400 transition hover:text-rose-600"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL DIALOG MODAL */}
      {selectedTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl max-w-sm w-full border border-gray-150 dark:border-slate-700 shadow-xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedTx(null)}
              className="absolute right-4 top-4 p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Rincian Transaksi</h3>
            
            <div className="space-y-4">
              <div className="flex justify-center flex-col items-center p-4 bg-gray-50 dark:bg-slate-850 rounded-xl">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Nominal Transaksi</span>
                <span className={`text-2xl font-extrabold mt-1 ${selectedTx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {selectedTx.type === 'income' ? '+' : '-'}{formatRupiah(selectedTx.amount)}
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between border-b border-gray-50 dark:border-slate-750 pb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Tipe</span>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {selectedTx.type === 'income' ? 'Pendapatan (Pemasukan)' : 'Pengeluaran (Pengeluaran)'}
                  </span>
                </div>
                
                <div className="flex justify-between border-b border-gray-50 dark:border-slate-750 pb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Kategori</span>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{selectedTx.category}</span>
                </div>

                <div className="flex justify-between border-b border-gray-50 dark:border-slate-750 pb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Tanggal</span>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{selectedTx.date}</span>
                </div>

                {selectedTx.type === 'expense' && (
                  <>
                    <div className="flex justify-between border-b border-gray-50 dark:border-slate-750 pb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Tujuan</span>
                      <span className="text-xs font-bold text-gray-750 dark:text-gray-300">{selectedTx.purpose || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 dark:border-slate-750 pb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Metode</span>
                      <span className="text-xs font-bold text-gray-750 dark:text-gray-300">{selectedTx.method || 'Cash'}</span>
                    </div>
                  </>
                )}

                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Catatan Tambahan:</span>
                  <p className="text-xs text-gray-800 dark:text-gray-305 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-lg border border-gray-100 dark:border-slate-750">
                    {selectedTx.notes || 'Tidak ada catatan tambahan.'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="mt-6 w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-gray-800 dark:text-white font-semibold text-sm rounded-xl transition cursor-pointer"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      )}

      {/* EDIT MODAL ELEMENT */}
      {editingTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl max-w-md w-full border border-gray-150 dark:border-slate-700 shadow-xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setEditingTx(null)}
              className="absolute right-4 top-4 p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Edit Transaksi ({editingTx.type === 'income' ? 'Pendapatan' : 'Pengeluaran'})</h3>
            
            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tanggal</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white"
                  value={editingTx.date}
                  onChange={(e) => setEditingTx({ ...editingTx, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Jumlah (Rp)</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white"
                  value={editingTx.amount}
                  onChange={(e) => setEditingTx({ ...editingTx, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>

              {editingTx.type === 'expense' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Digunakan Untuk</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white"
                      value={editingTx.purpose || ''}
                      onChange={(e) => setEditingTx({ ...editingTx, purpose: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Metode Pembayaran</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white"
                      value={editingTx.method || 'Cash'}
                      onChange={(e) => setEditingTx({ ...editingTx, method: e.target.value })}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Transfer">Transfer</option>
                      <option value="E-wallet">E-wallet</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Keterangan / Catatan</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white resize-none"
                  value={editingTx.notes || ''}
                  onChange={(e) => setEditingTx({ ...editingTx, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition cursor-pointer"
                >
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2.5 bg-gray-150 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-605 text-gray-700 dark:text-white font-semibold text-sm rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
