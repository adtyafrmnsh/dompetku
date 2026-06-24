/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { getUsers, saveUsers } from '../utils/storage';
import { User } from '../types';
import { Eye, EyeOff, Wallet, UserPlus, ArrowLeft } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../utils/firebase';
import { dbSaveUserProfile } from '../utils/firebaseStorage';

interface RegisterViewProps {
  onRegisterSuccess: (newUser: User) => void;
  onNavigateToLogin: () => void;
}

export default function RegisterView({ onRegisterSuccess, onNavigateToLogin }: RegisterViewProps) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const avatarBgs = [
    'bg-emerald-500',
    'bg-teal-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-amber-500',
    'bg-rose-500'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Field basic validations
    if (!fullName.trim() || !username.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMsg('Semua kolom wajib diisi.');
      return;
    }

    if (username.trim().includes(' ')) {
      setErrorMsg('Username tidak boleh mengandung spasi.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal terdiri dari 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create Auth credential
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const fbUser = userCredential.user;

      // 2. Generate random avatar background
      const randomBg = avatarBgs[Math.floor(Math.random() * avatarBgs.length)];

      // 3. Create user object using FB uid as primary id
      const newUser: User = {
        id: fbUser.uid,
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim(),
        password: password, // For easy recovery reference
        avatarBg: randomBg
      };

      // 4. Save to firestore cloud database
      await dbSaveUserProfile(newUser);

      // Save local backup reference
      const allUsers = getUsers();
      allUsers.push(newUser);
      saveUsers(allUsers);

      setSuccessMsg('Pendaftaran Akun Cloud Berhasil! Mengalihkan...');
      setTimeout(() => {
        onRegisterSuccess(newUser);
      }, 1500);
    } catch (err: any) {
      console.warn("Firebase registration error, falling back to local storage:", err);
      
      const allUsers = getUsers();
      const emailExists = allUsers.some(u => u.email.toLowerCase() === email.trim().toLowerCase());
      const usernameExists = allUsers.some(u => u.username.toLowerCase() === username.trim().toLowerCase());
      
      if (emailExists) {
        setErrorMsg('Email ini sudah terdaftar secara lokal. Silakan pilih akun lain.');
        setLoading(false);
        return;
      }
      if (usernameExists) {
        setErrorMsg('Nama pengguna (username) ini sudah terdaftar secara lokal.');
        setLoading(false);
        return;
      }
      
      // Create local user
      const randomBg = avatarBgs[Math.floor(Math.random() * avatarBgs.length)];
      const localId = 'local_' + Math.random().toString(36).substring(2, 10);
      const newUser: User = {
        id: localId,
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim(),
        password: password,
        avatarBg: randomBg
      };
      
      allUsers.push(newUser);
      saveUsers(allUsers);
      
      setSuccessMsg('Pendaftaran Berhasil (Offline/Lokal)! Mengalihkan...');
      setTimeout(() => {
        onRegisterSuccess(newUser);
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors duration-200 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700">
        <div>
          <button 
            type="button"
            onClick={onNavigateToLogin}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition cursor-pointer mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke Masuk
          </button>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-xl bg-emerald-500 text-white animate-pulse">
            <Wallet className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Buat Akun Baru
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Mulai simpan transaksi keuangan Anda dengan aman di Dompetku
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {errorMsg && (
            <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-sm border border-rose-100 dark:border-rose-900/50 flex items-center gap-2 animate-bounce" id="register-error">
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl text-sm border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-2" id="register-success">
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-4 rounded-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nama Lengkap
              </label>
              <input
                id="register-fullname"
                type="text"
                required
                disabled={loading}
                className="appearance-none rounded-xl relative block w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all shadow-sm"
                placeholder="Nama Lengkap Anda"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username (Tanpa spasi)
              </label>
              <input
                id="register-username"
                type="text"
                required
                disabled={loading}
                className="appearance-none rounded-xl relative block w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all shadow-sm"
                placeholder="adit"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Alamat Email
              </label>
              <input
                id="register-email"
                type="email"
                required
                disabled={loading}
                className="appearance-none rounded-xl relative block w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all shadow-sm"
                placeholder="adit@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={loading}
                    className="appearance-none rounded-xl relative block w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm pr-10 transition-all shadow-sm"
                    placeholder="Min 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Konfirmasi Sandi
                </label>
                <input
                  id="register-confirm-password"
                  type="password"
                  required
                  disabled={loading}
                  className="appearance-none rounded-xl relative block w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all shadow-sm"
                  placeholder="Ulangi sandi"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              id="btn-register"
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors shadow-md cursor-pointer disabled:opacity-50"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <UserPlus className="h-5 w-5 text-emerald-300 group-hover:text-emerald-250" aria-hidden="true" />
              </span>
              {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
            </button>
          </div>
        </form>

        <div className="text-center pt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sudah memiliki akun?{' '}
            <button
              id="link-login"
              onClick={onNavigateToLogin}
              className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 focus:outline-none underline transition cursor-pointer"
            >
              Masuk disini
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

