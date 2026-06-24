/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { User, Transaction, SavingsTarget, ViewType } from '../types';
import { getUserTransactions, getUserTargets, formatRupiah } from '../utils/storage';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  PlusCircle, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Target,
  ArrowRight,
  HelpCircle,
  PiggyBank
} from 'lucide-react';

interface DashboardViewProps {
  user: User;
  onNavigateToView: (view: ViewType) => void;
}

export default function DashboardView({ user, onNavigateToView }: DashboardViewProps) {
  const transactions = useMemo(() => getUserTransactions(user.id), [user.id]);
  const targets = useMemo(() => getUserTargets(user.id), [user.id]);

  // --- STATS MATHEMATICAL CALCULATION ---
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    });

    const balance = income - expense;
    return { income, expense, balance };
  }, [transactions]);

  // Recent transactions list (last 4 items)
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 4);
  }, [transactions]);

  // --- FINANCIAL ALERTS SYSTEM (NOTIFIKASI KEUANGAN) ---
  const activeAlerts = useMemo(() => {
    const alertsList: { type: 'success' | 'warning' | 'info'; message: string; system: string }[] = [];

    // Alert 1: Savings target completed check
    targets.forEach(t => {
      if (t.currentProgress >= t.targetAmount) {
        alertsList.push({
          type: 'success',
          message: `Hebat! Target tabungan "${t.name}" sebesar ${formatRupiah(t.targetAmount)} sudah tercapai 100%! 🎉`,
          system: 'Target Tabungan'
        });
      } else if (t.currentProgress >= t.targetAmount * 0.75) {
        alertsList.push({
          type: 'info',
          message: `Hampir selesai! Tabungan "${t.name}" Anda sudah mencapai ${Math.round((t.currentProgress / t.targetAmount) * 100)}%. Semangat menabung! 🚀`,
          system: 'Target Tabungan'
        });
      }
    });

    // Alert 2: High spending warnings (expenses > 70% of income)
    if (totals.income > 0) {
      const spendingRatio = (totals.expense / totals.income) * 100;
      if (spendingRatio > 80) {
        alertsList.push({
          type: 'warning',
          message: `Peringatan: Pengeluaran bulan ini mendominasi sebesar ${spendingRatio.toFixed(0)}% dari total pemasukan. Harap hemat belanja harian! ⚠️`,
          system: 'Rasio Keuangan'
        });
      } else if (spendingRatio > 50) {
        alertsList.push({
          type: 'info',
          message: `Info: Pengeluaran Anda berada di ritme sedang (${spendingRatio.toFixed(0)}% dari pendapatan). Perbanyak porsi tabungan. 💡`,
          system: 'Rasio Keuangan'
        });
      }
    }

    // Default safe alert if lists are clear
    if (alertsList.length === 0) {
      alertsList.push({
        type: 'success',
        message: 'Kondisi kas Anda aman! Yuk, mulailah mencatat target impian baru di menu Target Tabungan.',
        system: 'Asisten Keuangan'
      });
    }

    return alertsList;
  }, [targets, totals]);

  // Custom visual SVG chart for dashboard: Monthly bars (summarized last 6 transactions grouped by categories)
  const categorySummaryStats = useMemo(() => {
    const categories: Record<string, number> = {};
    let totalExpense = 0;
    
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
      totalExpense += t.amount;
    });

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
      percent: Math.round((value / (totalExpense || 1)) * 100)
    })).sort((a,b) => b.value - a.value).slice(0, 3);
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Dynamic Welcome Heading */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 transition-colors">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight" id="dashboard-welcome">
            Halo, {user.fullName || user.username}! 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Selamat datang kembali di DompetKu. Pantau grafik dan anggaran bulanan Anda di bawah.</p>
        </div>
        
        {/* Rapid access buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onNavigateToView('income')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Tambah Pemasukan</span>
          </button>
          <button
            onClick={() => onNavigateToView('expense')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Tambah Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* THREE BANK CARDS STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* TOTAL SALDO CARD */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs relative overflow-hidden group transition-all duration-300 hover:-translate-y-1">
          {/* Subtle logo vector on background */}
          <div className="absolute right-0 bottom-0 translate-y-3 translate-x-3 text-slate-100 dark:text-slate-700/20 select-none pointer-events-none group-hover:scale-110 transition-transform">
            <Wallet className="h-28 w-28" />
          </div>
          
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Saldo Kas</span>
            <span className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 rounded-lg text-xs font-bold">Dompet</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight font-mono word-break" id="dashboard-total-saldo-val">
            {formatRupiah(totals.balance)}
          </h2>
          <p className="text-[11px] text-gray-400 mt-2 font-medium">Saldo Dompet = Pendapatan - Pengeluaran</p>
        </div>

        {/* INCOME CARD */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs relative overflow-hidden group transition-all duration-300 hover:-translate-y-1">
          <div className="absolute right-0 bottom-0 translate-y-3 translate-x-3 text-emerald-50 dark:text-emerald-950/10 select-none pointer-events-none group-hover:scale-110 transition-transform">
            <TrendingUp className="h-28 w-28" />
          </div>

          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Pendapatan</span>
            <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">Inflow</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight font-mono" id="dashboard-total-income-val">
            +{formatRupiah(totals.income)}
          </h2>
          <p className="text-[11px] text-gray-400 mt-2 font-medium">Total dana masuk terekam</p>
        </div>

        {/* EXPENSE CARD */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs relative overflow-hidden group transition-all duration-300 hover:-translate-y-1">
          <div className="absolute right-0 bottom-0 translate-y-3 translate-x-3 text-rose-50 dark:text-rose-955/10 select-none pointer-events-none group-hover:scale-110 transition-transform">
            <TrendingDown className="h-28 w-28" />
          </div>

          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Pengeluaran</span>
            <span className="p-1.5 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">Outflow</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-450 tracking-tight font-mono" id="dashboard-total-expense-val">
            -{formatRupiah(totals.expense)}
          </h2>
          <p className="text-[11px] text-gray-400 mt-2 font-medium">Penggunaan anggaran belanja</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Notifications & Widgets and Recent Activity */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* NOTIFICATION LOG SYSTEM */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs transition-colors">
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-emerald-500 animate-pulse" />
              Notifikasi Keuangan & Insight
            </h3>

            <div className="space-y-3">
              {activeAlerts.map((alert, index) => {
                const colorMap = {
                  success: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-990/40',
                  warning: 'bg-rose-50 dark:bg-rose-950/25 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-955/40',
                  info: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-150/50 dark:border-indigo-900/40'
                };
                
                const iconMap = {
                  success: <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />,
                  warning: <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />,
                  info: <Info className="h-5 w-5 text-indigo-500 shrink-0" />
                };

                return (
                  <div 
                    key={index}
                    className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed transition-all shadow-2xs ${colorMap[alert.type] || colorMap.info}`}
                  >
                    {iconMap[alert.type] || iconMap.info}
                    <div>
                      <span className="font-bold block uppercase tracking-wider text-[10px] opacity-75 mb-0.5">{alert.system}</span>
                      <span>{alert.message}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TRANSAKSI TERAKHIR (Latest Transactions) */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <History className="h-5 w-5 text-emerald-500" />
                Transaksi Terakhir
              </h3>
              <button
                onClick={() => onNavigateToView('transactions')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-555 dark:text-emerald-400 flex items-center gap-1 cursor-pointer hover:underline"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-50 dark:border-slate-750 rounded-xl">
                <HelpCircle className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-gray-500 dark:text-gray-400 text-xs text-center font-semibold">Belum memiliki catatan kas.</p>
                <p className="text-gray-400 dark:text-gray-550 text-[11px] text-center mt-1">Silakan tambahkan data pemasukan atau pengeluaran di atas.</p>
              </div>
            ) : (
              <div className="space-y-3" id="dashboard-recent-tx-list">
                {recentTransactions.map((tx) => (
                  <div 
                    key={tx.id} 
                    className="p-3.5 bg-gray-50 dark:bg-slate-850/60 rounded-xl border border-gray-100/50 dark:border-slate-700/60 flex items-center justify-between gap-3 shadow-3xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {tx.type === 'income' ? (
                        <div className="h-9.5 w-9.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <ArrowUpRight className="h-5 w-5" />
                        </div>
                      ) : (
                        <div className="h-9.5 w-9.5 bg-rose-50 dark:bg-rose-950/40 rounded-lg text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                          <ArrowDownLeft className="h-5 w-5" />
                        </div>
                      )}
                      
                      <div className="min-w-0">
                        <span className="font-bold text-gray-900 dark:text-white text-sm block truncate">
                          {tx.type === 'income' ? (tx.notes || tx.category) : (tx.purpose || tx.category)}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-200/50 dark:bg-slate-700 px-2 py-0.5 rounded">
                            {tx.category}
                          </span>
                          <span className="text-[10px] text-gray-450">{tx.date}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`font-mono font-extrabold text-sm shrink-0 ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-450'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Target Tabungan Snippet & category pie overview */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* TARGET TABUNGAN HIGHLIGHT */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-emerald-500" />
                Target Tabungan
              </h3>
              <button
                onClick={() => onNavigateToView('targets')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-555 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Kelola</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {targets.length === 0 ? (
              <div className="py-8 bg-gray-50 dark:bg-slate-850/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-750 flex flex-col items-center justify-center px-4">
                <Target className="h-7 w-7 text-gray-300 dark:text-gray-600 mb-1.5" />
                <p className="text-gray-450 dark:text-gray-400 text-xs text-center font-semibold">Belum ada mimpi target tabungan.</p>
                <button
                  onClick={() => onNavigateToView('targets')}
                  className="mt-2 text-[11px] font-bold text-emerald-600 hover:underline"
                >
                  Buat Target Sekarang &rarr;
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {targets.slice(0, 2).map(t => {
                  const percent = Math.round((t.currentProgress / t.targetAmount) * 100) || 0;
                  return (
                    <div key={t.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-850 dark:text-gray-205 truncate">{t.name}</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono scale-95">{percent}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-slate-720 rounded-full overflow-hidden relative">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-455">
                        <span>{formatRupiah(t.currentProgress)}</span>
                        <span>{formatRupiah(t.targetAmount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* QUICK STATISTICS VIEW */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs transition-colors">
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-4">Pengeluaran Terboros</h3>

            {categorySummaryStats.length === 0 ? (
              <div className="py-8 bg-gray-50 dark:bg-slate-850/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-750 flex flex-col items-center justify-center px-4">
                <TrendingDown className="h-7 w-7 text-gray-300 dark:text-gray-600 mb-1.5" />
                <p className="text-gray-450 dark:text-gray-400 text-xs text-center font-semibold">Belum merekam riwayat spend belanja.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {categorySummaryStats.map(item => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-800 dark:text-gray-200">{item.name}</span>
                      <span className="text-gray-900 dark:text-white font-mono">{formatRupiah(item.value)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-720 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rose-500 rounded-full" 
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
