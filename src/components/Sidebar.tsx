/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ViewType, User } from '../types';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  History, 
  PieChart, 
  Target, 
  User as UserIcon, 
  LogOut, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Wallet,
  Settings
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  user: User;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Sidebar({ 
  currentView, 
  onViewChange, 
  user, 
  onLogout, 
  darkMode, 
  onToggleDarkMode 
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard' as ViewType, label: 'Dashboard', icon: BarChart3 },
    { id: 'income' as ViewType, label: 'Pendapatan', icon: TrendingUp },
    { id: 'expense' as ViewType, label: 'Pengeluaran', icon: TrendingDown },
    { id: 'transactions' as ViewType, label: 'Transaksi', icon: History },
    { id: 'reports' as ViewType, label: 'Laporan', icon: PieChart },
    { id: 'targets' as ViewType, label: 'Target Tabungan', icon: Target },
    { id: 'profile' as ViewType, label: 'Profil Saya', icon: UserIcon },
  ];

  return (
    <>
      {/* Mobile Top Navbar */}
      <header className="lg:hidden h-16 w-full flex items-center justify-between px-4 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 sticky top-0 z-30 transition-colors">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="font-bold text-gray-950 dark:text-white tracking-tight">DompetKu</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-705 dark:text-gray-400 focus:outline-none transition cursor-pointer"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5" />}
          </button>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-750 dark:text-gray-300 focus:outline-none transition cursor-pointer"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar overlay shelf */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Sidebar Component (hidden on mobile, visible on desktop, slideout on mobile menu) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700
        flex flex-col justify-between transition-transform duration-350 ease-out transform
        lg:translate-x-0 lg:static lg:h-screen lg:z-10
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div>
          {/* Logo Brand Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-gray-50 dark:border-slate-700/50">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-500/10">
                <Wallet className="h-5.5 w-5.5" />
              </div>
              <div>
                <span className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight block">DompetKu</span>
                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">Beta v1.1</span>
              </div>
            </div>

            {/* Mobile close button inside the sidebar list */}
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Profile Card Snapshot */}
          <div className="p-4 mx-3 my-4 bg-gray-50 dark:bg-slate-850/60 rounded-xl border border-gray-100/50 dark:border-slate-700/30 flex items-center gap-3">
            <div className={`h-11 w-11 rounded-xl text-white font-bold text-lg flex items-center justify-center shadow-xs uppercase shrink-0 ${user.avatarBg || 'bg-emerald-500'}`}>
              {user.fullName ? user.fullName.charAt(0) : user.username.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" id="sidebar-user-fullname">
                {user.fullName || user.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                @{user.username}
              </p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="px-3 space-y-1">
            {menuItems.map((item) => {
              const IconComp = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => {
                    onViewChange(item.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group cursor-pointer
                    ${isActive 
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/10' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/60 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  <IconComp className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-400 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls & Logout */}
        <div className="p-4 border-t border-gray-50 dark:border-slate-700/50 space-y-2">
          {/* Theme switcher on desktop sidebar (hidden in top menu, but visible here) */}
          <button
            onClick={onToggleDarkMode}
            className="w-full flex lg:flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/60 hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
          >
            {darkMode ? (
              <>
                <Sun className="h-5 w-5 text-amber-500 shrink-0" />
                <span>Mode Terang</span>
              </>
            ) : (
              <>
                <Moon className="h-5 w-5 text-gray-400 shrink-0" />
                <span>Mode Gelap</span>
              </>
            )}
          </button>

          <button
            id="btn-logout"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 transition cursor-pointer"
          >
            <LogOut className="h-5 w-5 text-rose-500 shrink-0" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>
    </>
  );
}
