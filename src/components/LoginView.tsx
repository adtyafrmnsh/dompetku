/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { getUsers, saveUsers, setCurrentUser } from '../utils/storage';
import { User } from '../types';
import { Eye, EyeOff, Wallet, LogIn, UserPlus, FileText } from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../utils/firebase';
import { dbGetUserProfile, dbSaveUserProfile } from '../utils/firebaseStorage';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  onNavigateToRegister: () => void;
}

export default function LoginView({ onLoginSuccess, onNavigateToRegister }: LoginViewProps) {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!usernameOrEmail.trim() || !password) {
      setErrorMsg('Semua kolom wajib diisi.');
      return;
    }

    const cleanInput = usernameOrEmail.trim().toLowerCase();

    // Check offline/guest fallback option
    if (cleanInput === 'demo') {
      if (password === 'demo123') {
        const demoUser: User = {
          id: 'demo',
          username: 'demo',
          email: 'demo@example.com',
          fullName: 'Adit Pratama',
          password: 'demo123',
          avatarBg: 'bg-emerald-500'
        };
        setCurrentUser(demoUser);
        onLoginSuccess(demoUser);
        return;
      } else {
        setErrorMsg('Sandi demo salah.');
        return;
      }
    }

    // Checking if there is a local user matching the input
    const allUsers = getUsers();
    const localUser = allUsers.find(u => 
      (u.email.toLowerCase() === cleanInput || u.username.toLowerCase() === cleanInput)
    );

    if (localUser && localUser.password === password) {
      // Direct local login match!
      setLoading(true);
      try {
        if (!localUser.id.startsWith('local_') && localUser.email.includes('@')) {
          await signInWithEmailAndPassword(auth, localUser.email, password);
        }
      } catch (err) {
        console.warn("Firebase credentials warning (safe to ignore for local/offline):", err);
      }
      
      setCurrentUser(localUser);
      onLoginSuccess(localUser);
      setLoading(false);
      return;
    }

    // If no local match, and input is not an email, we cannot proceed with Firebase
    if (!cleanInput.includes('@')) {
      setErrorMsg('Nama pengguna atau kata sandi salah (Gunakan email untuk akun cloud).');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanInput, password);
      const fbUser = userCredential.user;
      
      // Load user profile from firestore
      let profile = await dbGetUserProfile(fbUser.uid);
      if (!profile) {
        // Fallback schema if document doesn't exist
        profile = {
          id: fbUser.uid,
          username: fbUser.email?.split('@')[0] || 'pengguna',
          email: fbUser.email || '',
          fullName: fbUser.displayName || 'Pengguna DompetKu',
          avatarBg: 'bg-emerald-500',
          password: password // cache password locally for robust offline login
        };
        // Save the fallback
        await dbSaveUserProfile(profile);
      } else if (!profile.password) {
        // preserve password locally for subsequent offline matching
        profile.password = password;
      }

      // Sync to local list if not present
      const updatedUsers = getUsers();
      const existingIdx = updatedUsers.findIndex(u => u.id === profile!.id);
      if (existingIdx === -1) {
        updatedUsers.push({ ...profile, password });
      } else {
        updatedUsers[existingIdx] = { ...updatedUsers[existingIdx], ...profile, password };
      }
      saveUsers(updatedUsers);

      setCurrentUser(profile);
      onLoginSuccess(profile);
    } catch (err: any) {
      console.error("Firebase login error:", err);
      let friendlyMessage = 'Gagal masuk. Pastikan email & sandi Anda benar.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyMessage = 'Kata sandi salah atau akun tidak sesuai.';
      } else if (err.code === 'auth/user-not-found') {
        friendlyMessage = 'Email tidak ditemukan. Mari buat akun baru.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Format email Anda salah.';
      }
      setErrorMsg(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Required pop-up to support correct iframe domain boundaries
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      let profile = await dbGetUserProfile(fbUser.uid);
      if (!profile) {
        const emailVal = fbUser.email || '';
        profile = {
          id: fbUser.uid,
          username: emailVal.split('@')[0] || 'user_' + Math.random().toString(36).substring(2, 6),
          email: emailVal,
          fullName: fbUser.displayName || 'Pengguna Google',
          avatarBg: 'bg-emerald-500'
        };
        await dbSaveUserProfile(profile);
      }

      setCurrentUser(profile);
      onLoginSuccess(profile);
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setErrorMsg('Domain pratinjau ini belum diotorisasi di Firebase Google Sign-In. Silakan daftar menggunakan Email & Kata Sandi biasa, atau gunakan akun "demo" dengan kata sandi "demo123" untuk demo langsung.');
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg('Gagal masuk menggunakan Google. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-slate-900 transition-colors duration-200 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-gray-100/80 dark:border-slate-700">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-xl bg-emerald-500 text-white animate-bounce">
            <Wallet className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            DompetKu
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Mulai simpan transaksi keuangan Anda dengan aman di Dompetku
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {errorMsg && (
            <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-sm border border-rose-150/40 dark:border-rose-900/50 flex items-center gap-2 animate-pulse" id="login-error">
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-4 rounded-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Alamat Email
              </label>
              <input
                id="login-username"
                type="text"
                required
                disabled={loading}
                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-slate-850 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all shadow-sm"
                placeholder="nama@email.com"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-slate-850 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm pr-10 transition-all shadow-sm"
                  placeholder="••••••••"
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
          </div>

          <div>
            <button
              id="btn-login"
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors cursor-pointer shadow-md shadow-emerald-500/10 disabled:opacity-50"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-emerald-300 group-hover:text-emerald-250" aria-hidden="true" />
              </span>
              {loading ? 'Menghubungkan...' : 'Masuk ke Akun'}
            </button>
          </div>
        </form>

        <div className="relative my-4 flex items-center">
          <div className="flex-grow border-t border-gray-200 dark:border-slate-700"></div>
          <span className="mx-4 text-xs text-gray-400 uppercase font-bold tracking-wider">Atau</span>
          <div className="flex-grow border-t border-gray-200 dark:border-slate-700"></div>
        </div>

        {/* Google sign-in integration */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 py-3 border border-gray-250 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-750/70 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 transition cursor-pointer disabled:opacity-50"
        >
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" width="24" height="24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <span>Masuk dengan Google</span>
        </button>

        <div className="text-center pt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Belum memiliki data kas di awan?{' '}
            <button
              id="link-register"
              onClick={onNavigateToRegister}
              className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 focus:outline-none underline transition cursor-pointer"
            >
              Daftar Sekarang
            </button>
          </p>
        </div>


      </div>
    </div>
  );
}

