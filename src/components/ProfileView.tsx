/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from '../types';
import { getUsers, saveUsers, setCurrentUser } from '../utils/storage';
import { User as UserIcon, Mail, Shield, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';

interface ProfileViewProps {
  user: User;
  onProfileUpdate: (updatedUser: User) => void;
  onLogout: () => void;
}

export default function ProfileView({ user, onProfileUpdate, onLogout }: ProfileViewProps) {
  // Profil States
  const [fullName, setFullName] = useState(user.fullName || '');
  const [email, setEmail] = useState(user.email || '');
  const [avatarBg, setAvatarBg] = useState(user.avatarBg || 'bg-emerald-500');

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Alerts
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });

  const avatarOptions = [
    'bg-emerald-500',
    'bg-teal-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-slate-800'
  ];

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg({ text: '', type: '' });

    if (!fullName.trim() || !email.trim()) {
      setProfileMsg({ text: 'Nama dan Email tidak boleh kosong.', type: 'error' });
      return;
    }

    const allUsers = getUsers();
    
    // Check duplicate email (excluding oneself)
    const emailExists = allUsers.some(
      u => u.email && u.id !== user.id && u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (emailExists) {
      setProfileMsg({ text: 'Email sudah digunakan oleh akun lain.', type: 'error' });
      return;
    }

    const updatedUsers = allUsers.map(u => {
      if (u.id === user.id) {
        const nextUser = {
          ...u,
          fullName: fullName.trim(),
          email: email.trim(),
          avatarBg: avatarBg
        };
        // Update storage state too
        setCurrentUser(nextUser);
        onProfileUpdate(nextUser);
        return nextUser;
      }
      return u;
    });

    saveUsers(updatedUsers);
    setProfileMsg({ text: 'Profil berhasil diperbarui!', type: 'success' });
    setTimeout(() => setProfileMsg({ text: '', type: '' }), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg({ text: '', type: '' });

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordMsg({ text: 'Semua kolom sandi harus diisi.', type: 'error' });
      return;
    }

    // Get current secure user full object
    const allUsers = getUsers();
    const dbUserIndex = allUsers.findIndex(
      u => u.id === user.id
    );

    if (dbUserIndex === -1) {
      setPasswordMsg({ text: 'Kesalahan sistem: Akun tidak ditemukan.', type: 'error' });
      return;
    }

    const dbUser = allUsers[dbUserIndex];

    if (dbUser.password !== currentPassword) {
      setPasswordMsg({ text: 'Kata sandi saat ini tidak cocok/salah.', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'Kata sandi baru minimal mempunyai panjang 6 karakter.', type: 'error' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ text: 'Konfirmasi kata sandi baru tidak cocok.', type: 'error' });
      return;
    }

    // Save
    allUsers[dbUserIndex].password = newPassword;
    saveUsers(allUsers);
    setCurrentUser(allUsers[dbUserIndex]);

    setPasswordMsg({ text: 'Kata sandi berhasil diubah!', type: 'success' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setTimeout(() => setPasswordMsg({ text: '', type: '' }), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 transition-colors">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UserIcon className="h-6 w-6 text-emerald-500" />
          Profil & Pengaturan Pengguna
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Atur kredensial akun, ganti foto/warna visual profil, dan ubah sandi masuk.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Avatar Select & General Profile Info */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 shadow-xs transition-colors space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-50 dark:border-slate-720 flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-emerald-500" />
            Detail Akun Utama
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {profileMsg.text && (
              <div className={`p-4 rounded-xl text-sm border flex items-center gap-2 ${
                profileMsg.type === 'success' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-990/40' 
                  : 'bg-rose-50 dark:bg-rose-950/25 text-rose-600 dark:text-rose-455 border-rose-100 dark:border-rose-900/50'
              }`}>
                {profileMsg.type === 'success' ? <CheckCircle2 className="h-4.5 w-4.5 shrink-0" /> : <AlertCircle className="h-4.5 w-4.5 shrink-0" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            {/* Custom Interactive Avatar selection */}
            <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-850 p-4 rounded-xl gap-3 border border-gray-100 dark:border-slate-750">
              <div className={`h-20 w-20 rounded-full font-bold text-3xl flex items-center justify-center text-white select-none uppercase shadow-md ${avatarBg}`}>
                {fullName ? fullName.charAt(0) : user.username.charAt(0)}
              </div>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Pilih Warna Latar Belakang Profil Anda:</span>
              
              <div className="flex flex-wrap items-center justify-center gap-2">
                {avatarOptions.map(bg => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setAvatarBg(bg)}
                    className={`h-6.5 w-6.5 rounded-full border-2 cursor-pointer transition-all ${bg} ${avatarBg === bg ? 'border-emerald-500 scale-115 ring-2 ring-emerald-550/25' : 'border-transparent hover:scale-105'}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Username / Akun (Tidak dapat diubah)
              </label>
              <input
                type="text"
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm bg-gray-50 dark:bg-slate-850 text-gray-500 dark:text-gray-450 cursor-not-allowed"
                value={`@${user.username}`}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Nama Lengkap
              </label>
              <input
                id="profile-fullname"
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-650 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <input
                  id="profile-email"
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-650 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-550"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail className="h-5 w-5 text-gray-450 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              id="btn-update-profile"
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-550 text-white font-bold text-sm rounded-xl transition cursor-pointer"
            >
              Simpan Profil Baru
            </button>
          </form>
        </div>

        {/* Right Card: Change password */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 shadow-xs transition-colors space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-50 dark:border-slate-720 flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-500" />
            Keamanan Akun (Ganti Sandi)
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordMsg.text && (
              <div className={`p-4 rounded-xl text-sm border flex items-center gap-2 ${
                passwordMsg.type === 'success' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-990/40' 
                  : 'bg-rose-50 dark:bg-rose-950/25 text-rose-600 dark:text-rose-455 border-rose-100 dark:border-rose-900/50'
              }`}>
                {passwordMsg.type === 'success' ? <CheckCircle2 className="h-4.5 w-4.5 shrink-0" /> : <AlertCircle className="h-4.5 w-4.5 shrink-0" />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Kata Sandi saat Ini
              </label>
              <input
                id="profile-current-password"
                type="password"
                required
                placeholder="Password Sekarang"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-650 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Kata Sandi Baru
              </label>
              <input
                id="profile-new-password"
                type="password"
                required
                placeholder="Sandi baru (min. 6 karakter)"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-650 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Konfirmasi Kata Sandi Baru
              </label>
              <input
                id="profile-confirm-new-password"
                type="password"
                required
                placeholder="Konfirmasi password baru"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-650 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>

            <button
              id="btn-change-password"
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition cursor-pointer"
            >
              Ubah Sandi Selesai
            </button>
          </form>

          {/* Quick logout block below change password for accessibility */}
          <div className="pt-6 border-t border-gray-100 dark:border-slate-700">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 p-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-bold text-sm rounded-xl transition cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
              Diluar Sesi / Ganti Akun Lain
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
