/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { User, Transaction } from '../types';
import { getUserTransactions, formatRupiah } from '../utils/storage';
import { 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  ArrowRight, 
  HelpCircle,
  Clock,
  AlertTriangle,
  Award
} from 'lucide-react';

interface LaporanViewProps {
  user: User;
}

type PeriodType = 'weekly' | 'monthly' | 'yearly';

export default function LaporanView({ user }: LaporanViewProps) {
  const [period, setPeriod] = useState<PeriodType>('monthly');

  const allTransactions = useMemo(() => getUserTransactions(user.id), [user.id]);

  // Filter transactions by period
  const filteredTxs = useMemo(() => {
    const today = new Date();
    
    return allTransactions.filter(t => {
      const txDate = new Date(t.date);
      if (isNaN(txDate.getTime())) return false;

      const diffTime = Math.abs(today.getTime() - txDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (period === 'weekly') {
        return diffDays <= 7;
      } else if (period === 'monthly') {
        // approximate 30 days or same month and year
        return diffDays <= 30;
      } else {
        // yearly, within 365 days
        return diffDays <= 365;
      }
    });
  }, [allTransactions, period]);

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let maxExpense = 0;
    let maxExpenseObj: Transaction | null = null;
    
    const categorySums: Record<string, number> = {};

    filteredTxs.forEach(t => {
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expense += t.amount;
        if (t.amount > maxExpense) {
          maxExpense = t.amount;
          maxExpenseObj = t;
        }

        categorySums[t.category] = (categorySums[t.category] || 0) + t.amount;
      }
    });

    // Find heaviest category
    let highestCategory = '-';
    let highestCategoryAmount = 0;
    Object.entries(categorySums).forEach(([cat, sum]) => {
      if (sum > highestCategoryAmount) {
        highestCategoryAmount = sum;
        highestCategory = cat;
      }
    });

    const balance = income - expense;

    return {
      income,
      expense,
      balance,
      maxExpense: maxExpenseObj,
      highestCategory,
      highestCategoryAmount,
      categorySums
    };
  }, [filteredTxs]);

  // Generate category bar percentages
  const categoryChartList = useMemo(() => {
    const totalExp = stats.expense || 1;
    return Object.entries(stats.categorySums)
      .map(([name, val]) => ({
        name,
        value: val as number,
        percentage: Math.round(((val as number) / totalExp) * 100),
      }))
      .sort((a, b) => (b.value as number) - (a.value as number));
  }, [stats]);

  // Let's build data for a gorgeous cashflow SVG bar chart
  // Grouping by date for selected period to render visual SVG graph
  const timelineData = useMemo(() => {
    const groups: Record<string, { income: number; expense: number }> = {};
    
    // Sort transactions oldest to newest for timeline listing
    const sorted = [...filteredTxs].sort((a, b) => a.date.localeCompare(b.date));

    sorted.forEach(t => {
      // Grouping key: if weekly -> daily date, if monthly -> daily or weekly intervals, if yearly -> monthly label
      let key = t.date;
      if (period === 'yearly') {
        key = t.date.substring(0, 7); // YYYY-MM
      }
      
      if (!groups[key]) {
        groups[key] = { income: 0, expense: 0 };
      }
      
      if (t.type === 'income') {
        groups[key].income += t.amount;
      } else {
        groups[key].expense += t.amount;
      }
    });

    return Object.entries(groups).map(([label, val]) => ({
      label,
      income: val.income,
      expense: val.expense
    })).slice(-8); // take last 8 intervals to avoid overflow
  }, [filteredTxs, period]);

  // Calculate SVG Max scaling height
  const svgMaxHeight = useMemo(() => {
    let max = 10000;
    timelineData.forEach(d => {
      if (d.income > max) max = d.income;
      if (d.expense > max) max = d.expense;
    });
    return max * 1.15; // 15% padding
  }, [timelineData]);

  return (
    <div className="space-y-6">
      {/* Time Navigator Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 transition-colors">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <PieChart className="h-6 w-6 text-emerald-500" />
            Laporan Keuangan
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Analisis pengeluaran dan rasio tabungan periode ini.</p>
        </div>

        {/* Custom tabs switch */}
        <div className="flex bg-gray-100 dark:bg-slate-700 p-1.5 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${period === 'weekly' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-gray-600 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white'}`}
          >
            Mingguan (7 Hari)
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${period === 'monthly' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-gray-600 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white'}`}
          >
            Bulanan (30 Hari)
          </button>
          <button
            onClick={() => setPeriod('yearly')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${period === 'yearly' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-gray-600 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white'}`}
          >
            Tahunan (365 Hari)
          </button>
        </div>
      </div>

      {/* THREE CARDS SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs flex items-center gap-4 transition-colors">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium block">Total Pemasukan</span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 block">{formatRupiah(stats.income)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs flex items-center gap-4 transition-colors">
          <div className="h-11 w-11 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <TrendingDown className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium block">Total Pengeluaran</span>
            <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400 block">{formatRupiah(stats.expense)}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs flex items-center gap-4 transition-colors">
          <div className="h-11 w-11 rounded-xl bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-450 flex items-center justify-center shrink-0">
            <Clock className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium block">Saldo Kas Akhir</span>
            <span className={`text-xl font-extrabold block ${stats.balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatRupiah(stats.balance)}
            </span>
          </div>
        </div>
      </div>

      {/* HIGHEST LOGS HIGHLIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card: Peak Expense */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-3">
              <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
              Pengeluaran Terbesar Periode Ini
            </h3>
            {stats.maxExpense ? (
              <div className="space-y-2">
                <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                  -{formatRupiah(stats.maxExpense.amount)}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg">
                    {stats.maxExpense.category}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold truncate">
                    {stats.maxExpense.purpose}
                  </span>
                </div>
                <p className="text-[11px] text-gray-450">Tanggal Transaksi: {stats.maxExpense.date}</p>
              </div>
            ) : (
              <p className="text-sm font-semibold text-gray-400">Belum ada transaksi pengeluaran tercatat.</p>
            )}
          </div>
        </div>

        {/* Card: Most Expensive Category */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-3">
              <Award className="h-4.5 w-4.5 text-amber-500" />
              Kategori Terboros Periode Ini
            </h3>
            {stats.highestCategory !== '-' ? (
              <div className="space-y-2">
                <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                  {formatRupiah(stats.highestCategoryAmount)}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white bg-slate-900 dark:bg-amber-600 px-2.5 py-1 rounded-lg uppercase">
                    {stats.highestCategory}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                    Memakan {Math.round((stats.highestCategoryAmount / (stats.expense || 1)) * 100)}% dari seluruh pengluaran.
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm font-semibold text-gray-400">Belum ada kategori pengeluran terekam.</p>
            )}
          </div>
        </div>
      </div>

      {/* GRAPH CHART SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Comparation Timeline Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs transition-colors">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6">Tren Aliran Kas Masuk vs Keluar</h3>

          {timelineData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <HelpCircle className="h-10 w-10 text-gray-300 dark:text-gray-650 mb-2" />
              <p className="text-gray-500 text-sm font-medium">Data kas belum mencukupi untuk membuat tren timeline.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Responsive SVG Container */}
              <div className="relative w-full h-[220px]">
                <svg className="w-full h-full" viewBox="0 0 500 220" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="40" y1="20" x2="480" y2="20" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-700/50" />
                  <line x1="40" y1="80" x2="480" y2="80" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-700/50" />
                  <line x1="40" y1="140" x2="480" y2="140" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-700/50" />
                  <line x1="40" y1="200" x2="480" y2="200" stroke="#e2e8f0" strokeWidth="1.5" className="dark:stroke-slate-700" />

                  {/* Bars */}
                  {timelineData.map((d, index) => {
                    const barGroupWidth = 440 / timelineData.length;
                    const xPosition = 40 + index * barGroupWidth + (barGroupWidth - 40) / 2;
                    
                    // Heights percentage mapped to SVG box
                    const incomeHeight = Math.min((d.income / svgMaxHeight) * 180, 180);
                    const expenseHeight = Math.min((d.expense / svgMaxHeight) * 180, 180);

                    return (
                      <g key={d.label}>
                        {/* Income Bar (Green) */}
                        <rect
                          x={xPosition}
                          y={200 - incomeHeight}
                          width="12"
                          height={Math.max(incomeHeight, 2)}
                          rx="4"
                          className="fill-emerald-500 hover:fill-emerald-400 transition-all cursor-pointer"
                        >
                          <title>Pemasukan: {formatRupiah(d.income)}</title>
                        </rect>

                        {/* Expense Bar (Red) */}
                        <rect
                          x={xPosition + 15}
                          y={200 - expenseHeight}
                          width="12"
                          height={Math.max(expenseHeight, 2)}
                          rx="4"
                          className="fill-rose-500 hover:fill-rose-400 transition-all cursor-pointer"
                        >
                          <title>Pengeluaran: {formatRupiah(d.expense)}</title>
                        </rect>

                        {/* Labels for X axis */}
                        <text
                          x={xPosition + 12}
                          y="215"
                          textAnchor="middle"
                          className="fill-gray-400 text-[9px] font-mono dark:fill-gray-550"
                        >
                          {d.label.substring(5)} {/* cut YYYY- */}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Legend and notes */}
              <div className="flex items-center justify-center gap-6 pt-2 text-xs">
                <div className="flex items-center gap-1.5 font-medium text-gray-600 dark:text-gray-300">
                  <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block"></span>
                  <span>Pendapatan</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-gray-600 dark:text-gray-300">
                  <span className="h-3 w-3 rounded-full bg-rose-500 inline-block"></span>
                  <span>Pengeluaran</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Categories Proportional List */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs transition-colors">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Rincian Belanja Berdasar Kategori</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 font-medium">Berapa porsi anggaran yang keluar per kategori?</p>

          {categoryChartList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <HelpCircle className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-gray-500 text-sm font-medium">Belum ada data pengeluaran terekam.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categoryChartList.map(item => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{item.name}</span>
                    <div className="space-x-1 font-mono">
                      <span className="font-bold text-gray-900 dark:text-white">{formatRupiah(item.value)}</span>
                      <span className="text-gray-400">({item.percentage}%)</span>
                    </div>
                  </div>
                  {/* Progress bar container */}
                  <div className="w-full h-2 bg-gray-100 dark:bg-slate-720 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-500" 
                      style={{ width: `${item.percentage}%` }}
                    />
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
