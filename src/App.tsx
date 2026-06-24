/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, ViewType } from './types';
import { 
  getCurrentUser, 
  setCurrentUser, 
  getUsers, 
  saveUsers, 
  getUserTransactions, 
  saveUserTransactions, 
  getUserTargets, 
  saveUserTargets,
  getDarkModeTheme,
  setDarkModeTheme 
} from './utils/storage';

// Import Views
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import PendapatanView from './components/PendapatanView';
import PengeluaranView from './components/PengeluaranView';
import TransaksiView from './components/TransaksiView';
import LaporanView from './components/LaporanView';
import TargetView from './components/TargetView';
import ProfileView from './components/ProfileView';

// Firebase Integrations
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './utils/firebase';
import { dbGetUserProfile, dbGetTransactions, dbGetTargets } from './utils/firebaseStorage';

export default function App() {
  const [currentUserObj, setCurrentUserState] = useState<User | null>(null);
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const active = getCurrentUser();
    return getDarkModeTheme(active?.username);
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Forces sub-component re-fetches

  // Initialize Demo User and seed dummy data once on initial load
  useEffect(() => {
    const allUsers = getUsers();
    const demoUser = allUsers.find(u => u.username && u.username.toLowerCase() === 'demo');

    if (!demoUser) {
      // Create 'demo' user
      const seededUser: User = {
        id: 'demo',
        username: 'demo',
        email: 'demo@example.com',
        fullName: 'Adit Pratama',
        password: 'demo123',
        avatarBg: 'bg-emerald-500'
      };
      allUsers.push(seededUser);
      saveUsers(allUsers);

      // Seed transactions for 'demo' user
      const sampleTx = [
        {
          id: 'tx_seed_1',
          userId: 'demo',
          date: '2026-06-18',
          amount: 15000000,
          type: 'income' as const,
          category: 'Gaji',
          notes: 'Gaji Utama Bulanan Kantor'
        },
        {
          id: 'tx_seed_2',
          userId: 'demo',
          date: '2026-06-19',
          amount: 2500000,
          type: 'income' as const,
          category: 'Freelance',
          notes: 'Proyek Desain Logo Hub'
        },
        {
          id: 'tx_seed_3',
          userId: 'demo',
          date: '2026-06-19',
          amount: 1200000,
          type: 'expense' as const,
          category: 'Tagihan',
          purpose: 'Sewa Kos Bulanan Ke-5',
          method: 'Transfer'
        },
        {
          id: 'tx_seed_4',
          userId: 'demo',
          date: '2026-06-20',
          amount: 85000,
          type: 'expense' as const,
          category: 'Makanan',
          purpose: 'Makan Nasi Padang Keluarga',
          method: 'Cash',
          notes: 'Restoran Sederhana'
        },
        {
          id: 'tx_seed_5',
          userId: 'demo',
          date: '2026-06-20',
          amount: 450000,
          type: 'expense' as const,
          category: 'Belanja',
          purpose: 'Beli Sepatu Olahraga Baru',
          method: 'E-wallet',
          notes: 'Mall'
        }
      ];
      saveUserTransactions('demo', sampleTx);

      // Seed Savings Targets for 'demo' user
      const sampleTargets = [
        {
          id: 'tgt_seed_1',
          userId: 'demo',
          name: 'Beli Laptop Asus Zenbook',
          targetAmount: 12000000,
          currentProgress: 4500000
        },
        {
          id: 'tgt_seed_2',
          userId: 'demo',
          name: 'Liburan ke Bali Akhir Tahun',
          targetAmount: 5000000,
          currentProgress: 2000000
        }
      ];
      saveUserTargets('demo', sampleTargets);
    }

    // Load active logged user (fallback or active cached)
    const active = getCurrentUser();
    if (active) {
      setCurrentUserState(active);
      setDarkMode(getDarkModeTheme(active.username));
    } else {
      setDarkMode(getDarkModeTheme());
    }
  }, []);

  // Set up auth state change subscription
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await dbGetUserProfile(fbUser.uid);
          if (profile) {
            // Load transactions + targets and cache them in LocalStorage
            const txs = await dbGetTransactions(fbUser.uid);
            const tgts = await dbGetTargets(fbUser.uid);

            localStorage.setItem(`transactions_${fbUser.uid.toLowerCase()}`, JSON.stringify(txs));
            localStorage.setItem(`targets_${fbUser.uid.toLowerCase()}`, JSON.stringify(tgts));

            setCurrentUserState(profile);
            setCurrentUser(profile);
            setDarkMode(getDarkModeTheme(profile.username));
            forceRefreshChild();
          }
        } catch (e) {
          console.error("Error load cloud metadata:", e);
        }
      } else {
        // Safe offline transition: do not aggressively log out on initial load tick to support offline fallback and fast refresh
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync Dark Mode theme class with HTML
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle successful login or registration
  const handleAuthSuccess = (userObj: User) => {
    setCurrentUser(userObj);
    setCurrentUserState(userObj);
    setDarkMode(getDarkModeTheme(userObj.username));
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Firebase logout failure:", err);
    }
    setCurrentUser(null);
    setCurrentUserState(null);
    setAuthScreen('login');
    // Revert to global dark mode theme or light
    setDarkMode(getDarkModeTheme());
  };

  const handleToggleDarkMode = () => {
    const nextVal = !darkMode;
    setDarkMode(nextVal);
    setDarkModeTheme(nextVal, currentUserObj?.username);
  };

  const handleProfileUpdated = (updatedUser: User) => {
    setCurrentUserState(updatedUser);
  };

  const forceRefreshChild = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Render secondary dashboard panels
  const renderActiveView = () => {
    if (!currentUserObj) return null;

    switch (currentView) {
      case 'dashboard':
        return (
          <div key={`dash_${refreshTrigger}`}>
            <DashboardView 
              user={currentUserObj} 
              onNavigateToView={(v) => setCurrentView(v)} 
            />
          </div>
        );
      case 'income':
        return (
          <div key={`inc_${refreshTrigger}`}>
            <PendapatanView 
              user={currentUserObj} 
              onTransactionChange={forceRefreshChild} 
            />
          </div>
        );
      case 'expense':
        return (
          <div key={`exp_${refreshTrigger}`}>
            <PengeluaranView 
              user={currentUserObj} 
              onTransactionChange={forceRefreshChild} 
            />
          </div>
        );
      case 'transactions':
        return (
          <div key={`tx_${refreshTrigger}`}>
            <TransaksiView 
              user={currentUserObj} 
              onTransactionChange={forceRefreshChild} 
            />
          </div>
        );
      case 'reports':
        return (
          <div key={`rep_${refreshTrigger}`}>
            <LaporanView user={currentUserObj} />
          </div>
        );
      case 'targets':
        return (
          <div key={`tgt_${refreshTrigger}`}>
            <TargetView user={currentUserObj} />
          </div>
        );
      case 'profile':
        return (
          <div key={`prof_${refreshTrigger}`}>
            <ProfileView 
              user={currentUserObj} 
              onProfileUpdate={handleProfileUpdated} 
              onLogout={handleLogout} 
            />
          </div>
        );
      default:
        return (
          <div key="default_view">
            <DashboardView user={currentUserObj} onNavigateToView={setCurrentView} />
          </div>
        );
    }
  };

  // Display Auth screens if not logged in
  if (!currentUserObj) {
    if (authScreen === 'register') {
      return (
        <RegisterView 
          onRegisterSuccess={handleAuthSuccess} 
          onNavigateToLogin={() => setAuthScreen('login')} 
        />
      );
    }
    return (
      <LoginView 
        onLoginSuccess={handleAuthSuccess} 
        onNavigateToRegister={() => setAuthScreen('register')} 
      />
    );
  }

  // Dashboard structure with Sidebar + Main View wrapper
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        user={currentUserObj} 
        onLogout={handleLogout} 
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Main Panel Content Box */}
      <main className="flex-1 w-full p-4 lg:p-8 overflow-y-auto max-h-screen">
        <div className="max-w-6xl mx-auto py-2">
          {renderActiveView()}
        </div>
      </main>
    </div>
  );
}
