/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, SavingsTarget } from '../types';
import { getUserTargets, saveUserTargets, formatRupiah } from '../utils/storage';
import { Target, Plus, CheckCircle2, Trash2, Edit2, Wallet, Coins, Percent, AlertCircle } from 'lucide-react';

interface TargetViewProps {
  user: User;
}

export default function TargetView({ user }: TargetViewProps) {
  const [targets, setTargets] = useState<SavingsTarget[]>(() => 
    getUserTargets(user.id)
  );

  // Form State
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentProgress, setCurrentProgress] = useState('');
  
  // Funding modal / inline states
  const [fundTargetId, setFundTargetId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  
  // Modes & alerts
  const [editId, setEditId] = useState<string | null>(null);
  const [successAlert, setSuccessAlert] = useState('');
  const [errorAlert, setErrorAlert] = useState('');

  const showFeedback = (text: string, isError = false) => {
    if (isError) {
      setErrorAlert(text);
      setTimeout(() => setErrorAlert(''), 3000);
    } else {
      setSuccessAlert(text);
      setTimeout(() => setSuccessAlert(''), 3000);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showFeedback('Nama target harus diisi.', true);
      return;
    }

    const nTarget = parseFloat(targetAmount);
    const nProgress = parseFloat(currentProgress || '0');

    if (isNaN(nTarget) || nTarget <= 0) {
      showFeedback('Target jumlah tabungan harus valid (> 0).', true);
      return;
    }

    if (isNaN(nProgress) || nProgress < 0) {
      showFeedback('Progress tabungan saat ini tidak valid.', true);
      return;
    }

    if (nProgress > nTarget) {
      showFeedback('Tabungan terkumpul tidak boleh melebihi nominal target utama.', true);
      return;
    }

    const allTargets = getUserTargets(user.id);

    if (editId) {
      // Edit mode
      const updated = allTargets.map(t => {
        if (t.id === editId) {
          return {
            ...t,
            name: name.trim(),
            targetAmount: nTarget,
            currentProgress: nProgress,
          };
        }
        return t;
      });
      saveUserTargets(user.id, updated);
      setTargets(updated);
      setEditId(null);
      showFeedback('Target tabungan berhasil diubah!');
    } else {
      // Create mode
      const newTarget: SavingsTarget = {
        id: 'target_' + Math.random().toString(36).substring(2, 11),
        userId: user.id,
        name: name.trim(),
        targetAmount: nTarget,
        currentProgress: nProgress,
      };
      allTargets.push(newTarget);
      saveUserTargets(user.id, allTargets);
      setTargets(allTargets);
      showFeedback('Target tabungan baru berhasil dibuat!');
    }

    // Reset Form
    setName('');
    setTargetAmount('');
    setCurrentProgress('');
  };

  const handleEditInit = (t: SavingsTarget) => {
    setEditId(t.id);
    setName(t.name);
    setTargetAmount(String(t.targetAmount));
    setCurrentProgress(String(t.currentProgress));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    const allTargets = getUserTargets(user.id);
    const filtered = allTargets.filter(t => t.id !== id);
    saveUserTargets(user.id, filtered);
    setTargets(filtered);
    showFeedback('Target tabungan berhasil dihapus.');
    
    if (editId === id) {
      setEditId(null);
      setName('');
      setTargetAmount('');
      setCurrentProgress('');
    }
  };

  const handleAddFunds = (id: string) => {
    const amountNum = parseFloat(fundAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Masukkan jumlah tambahan dana yang valid.');
      return;
    }

    const allTargets = getUserTargets(user.id);
    let targetReached = false;
    let targetName = '';

    const updated = allTargets.map(t => {
      if (t.id === id) {
        const nextProgress = Math.min(t.currentProgress + amountNum, t.targetAmount);
        if (nextProgress === t.targetAmount && t.currentProgress < t.targetAmount) {
          targetReached = true;
          targetName = t.name;
        }
        return {
          ...t,
          currentProgress: nextProgress
        };
      }
      return t;
    });

    saveUserTargets(user.id, updated);
    setTargets(updated);
    setFundTargetId(null);
    setFundAmount('');

    if (targetReached) {
      showFeedback(`🎉 Selamat! Target tabungan "${targetName}" Anda telah tercapai!`);
    } else {
      showFeedback('Dana tabungan berhasil disimpan!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 transition-colors">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <Target className="h-6 w-6 text-emerald-500" />
          Target Impian & Tabungan
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Tentukan mimpi pencapaian Anda, sisihkan tabungan berkala, dan pantau penyelesaian targetnya secara otomatis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Add target form */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 shadow-xs h-fit transition-colors">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-50 dark:border-slate-755 mb-4 flex items-center gap-2">
            <Coins className="h-5 w-5 text-emerald-500" />
            {editId ? 'Ubah Target Impian' : 'Buat Target Impian Baru'}
          </h2>

          {successAlert && (
            <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/50 text-xs flex items-center gap-1.5" id="target-success-alert">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
              <span>{successAlert}</span>
            </div>
          )}

          {errorAlert && (
            <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/25 text-rose-600 dark:text-rose-455 rounded-xl border border-rose-100 dark:border-rose-900/50 text-xs flex items-center gap-1.5" id="target-error-alert">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{errorAlert}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Nama Impian / Target
              </label>
              <input
                id="target-name"
                type="text"
                required
                placeholder="Misal: Beli Laptop Asus Zenbook, DP Mobil"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800 text-gray-950 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Target Jumlah Tabungan (Rp)
              </label>
              <input
                id="target-amount"
                type="number"
                required
                min="1"
                placeholder="Misal: 10000000"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800 text-gray-950 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
              />
              <span className="text-[10px] text-gray-400 font-medium block mt-1">
                Konfirmasi: {targetAmount ? formatRupiah(parseFloat(targetAmount) || 0) : 'Rp0'}
              </span>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Tabungan yang Sudah Terkumpul Saat Ini (Rp)
              </label>
              <input
                id="target-progress"
                type="number"
                min="0"
                placeholder="Misal: 3000000 (Isi 0 jika baru terkumpul)"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800 text-gray-950 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={currentProgress}
                onChange={(e) => setCurrentProgress(e.target.value)}
              />
              <span className="text-[10px] text-gray-400 font-medium block mt-1">
                Konfirmasi: {currentProgress ? formatRupiah(parseFloat(currentProgress) || 0) : 'Rp0'}
              </span>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-50 dark:border-slate-700/50 mt-4">
              <button
                id="btn-save-target"
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-1"
              >
                {editId ? 'Perbarui Target' : 'Buat Target Impian'}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditId(null);
                    setName('');
                    setTargetAmount('');
                    setCurrentProgress('');
                  }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl text-sm transition cursor-pointer"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right column: Targets display lists with progress slider percentage */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white px-2">Daftar Impian & Progress</h3>

          {targets.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-gray-100 dark:border-slate-700 text-center shadow-xs flex flex-col items-center justify-center transition-colors">
              <Plus className="h-10 w-10 text-gray-300 dark:text-gray-650 mb-3 rounded-full bg-slate-50 dark:bg-slate-750 p-2.5" />
              <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">Belum membuat target impian tabungan.</p>
              <p className="text-gray-400 dark:text-gray-550 text-xs mt-1">Gunakan formulir disamping untuk merekam laptop, gadget, atau liburan impian Anda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {targets.map((t) => {
                const percentage = Math.round((t.currentProgress / t.targetAmount) * 100) || 0;
                const isCompleted = t.currentProgress >= t.targetAmount;

                return (
                  <div 
                    key={t.id} 
                    className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs space-y-4 transition-all hover:border-emerald-500/20"
                  >
                    {/* Title and control triggers */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                          {t.name}
                          {isCompleted && (
                            <span className="p-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full font-bold text-[10px] uppercase flex items-center px-1.5 scale-90">
                              Lunas / Selesai
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-gray-450 mt-0.5">Target Impian Tabungan Pribadi</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEditInit(t)}
                          className="p-1.5 bg-slate-50 dark:bg-slate-750 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                          title="Ubah Target"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 bg-slate-50 dark:bg-slate-750 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                          title="Hapus Target"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress details */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-end text-xs font-semibold">
                        <span className="text-gray-500 dark:text-gray-400">
                          Terkumpul: <strong className="text-emerald-600 dark:text-emerald-400">{formatRupiah(t.currentProgress)}</strong>
                        </span>
                        <span className="font-mono text-gray-400">
                          Target: <strong className="text-gray-800 dark:text-gray-205">{formatRupiah(t.targetAmount)}</strong>
                        </span>
                      </div>

                      {/* Slider and metric */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3.5 bg-gray-100 dark:bg-slate-720 rounded-full overflow-hidden relative">
                          <div 
                            className="h-full bg-emerald-550 dark:bg-emerald-450 rounded-full transition-all duration-700" 
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono w-10 text-right shrink-0">
                          {percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Deposit Fund Buttons */}
                    {!isCompleted && (
                      <div className="pt-2 border-t border-gray-50 dark:border-slate-720/55">
                        {fundTargetId === t.id ? (
                          <div className="flex gap-2 items-center animated fadeIn">
                            <input
                              type="number"
                              min="1"
                              placeholder="Ketik jumlah dana (misal: 100000)"
                              className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-slate-650 bg-white dark:bg-slate-800 text-xs rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900 dark:text-white"
                              value={fundAmount}
                              onChange={(e) => setFundAmount(e.target.value)}
                            />
                            <button
                              onClick={() => handleAddFunds(t.id)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-550 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                            >
                              Simpan
                            </button>
                            <button
                              onClick={() => {
                                setFundTargetId(null);
                                setFundAmount('');
                              }}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium text-xs rounded-xl transition cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setFundTargetId(t.id);
                              setFundAmount('');
                            }}
                            className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Wallet className="h-4 w-4" />
                            <span>Tambah Setoran Buku Tabungan</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
