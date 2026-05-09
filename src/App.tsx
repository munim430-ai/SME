/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X } from 'lucide-react';
import { auth, db, testConnection } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import { UserProfile, Language, Transaction } from './types';
import { cn } from './lib/utils';
import { addDays, addWeeks, addMonths, isBefore } from 'date-fns';

// Views
import SplashView from './components/views/SplashView';
import LoginView from './components/views/LoginView';
import NidScanner from './components/views/NidScanner';
import Onboarding from './components/views/Onboarding';
import Dashboard from './components/views/Dashboard';
import KhataView from './components/views/KhataView';
import ReceiptScanner from './components/views/ReceiptScanner';
import ChallanGenerator from './components/views/ChallanGenerator';
import ExploreView from './components/views/ExploreView';
import ProfileView from './components/views/ProfileView';
import TransactionsView from './components/views/TransactionsView';
import ReportGenerationView from './components/views/ReportGenerationView';
import ServicesView from './components/views/ServicesView';
import LoanPredictorView from './components/views/LoanPredictorView';
import SettingsView from './components/views/SettingsView';
import { collection, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'splash' | 'login' | 'nid' | 'onboarding' | 'dashboard' | 'khata' | 'receipt' | 'challan' | 'rates' | 'profile' | 'transactions' | 'management' | 'reports' | 'services' | 'loan_predictor' | 'agro_guide' | 'production_log' | 'stock_audit' | 'voice_assistant' | 'settings'>('splash');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lang, setLang] = useState<Language>('bn');
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [notification, setNotification] = useState<{title: string, body: string} | null>(null);
  const txUnsubscribeRef = useRef<(() => void) | null>(null);
  const lastAlertRef = useRef<number>(0);

  useEffect(() => {
    if (pushNotificationsEnabled && user && user.uid !== 'guest-preview') {
      const interval = setInterval(() => {
        const now = Date.now();
        if (now - lastAlertRef.current > 3600000) { // Max one alert per hour
          checkBusinessHealth();
          lastAlertRef.current = now;
        }
      }, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [pushNotificationsEnabled, user, transactions, profile]);

  const checkBusinessHealth = () => {
    // Check for overdue baki
    const overdue = transactions.find(t => t.isBaki && t.dueDate && isBefore(new Date(t.dueDate), new Date()));
    if (overdue) {
      setNotification({
        title: 'Payment Overdue',
        body: `Payment from ${overdue.description} was due. Please check Ledger.`
      });
      return;
    }

    // Check for large sales
    const largeSale = transactions.find(t => t.type === 'SALE' && t.amount > 50000 && (Date.now() - new Date(t.timestamp).getTime()) < 3600000);
    if (largeSale) {
       setNotification({
         title: 'High Revenue Alert',
         body: `Large sale of Tk ${largeSale.amount.toLocaleString()} recorded recently.`
       });
    }
  };

  useEffect(() => {
    if (user && transactions.length > 0 && user.uid !== 'guest-preview') {
      checkRecurringTransactions();
    }
  }, [user, transactions.length]);

  const checkRecurringTransactions = async () => {
    const recurring = transactions.filter(t => t.recurrence && t.recurrence !== 'NONE');
    const now = new Date();
    
    for (const tx of recurring) {
      const lastCheck = tx.lastRecurringGeneration ? new Date(tx.lastRecurringGeneration) : new Date(tx.timestamp);
      let nextDate: Date;
      
      switch (tx.recurrence) {
        case 'DAILY': nextDate = addDays(lastCheck, 1); break;
        case 'WEEKLY': nextDate = addWeeks(lastCheck, 1); break;
        case 'MONTHLY': nextDate = addMonths(lastCheck, 1); break;
        default: continue;
      }

      if (isBefore(nextDate, now)) {
        try {
          // Generate new instance
          await addDoc(collection(db, 'transactions'), {
            ...tx,
            id: undefined, // Let Firestore generate new ID
            timestamp: nextDate.toISOString(),
            lastRecurringGeneration: null, // Reset for new instance
            recurrence: 'NONE' // New instances are usually just logs, master keeps recurring? 
            // Or master updates its timestamp?
            // Usually, master stays and we spawn.
          });

          // Update master's last generation
          await updateDoc(doc(db, 'transactions', tx.id), {
            lastRecurringGeneration: nextDate.toISOString()
          });

          setNotification({
             title: 'Recurring Transaction',
             body: `Generated recurring ${tx.type.toLowerCase()}: ${tx.description}`
          });
        } catch (e) {
          console.error("Recurring generation failed", e);
        }
      }
    }
  };

  useEffect(() => {
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
    
    testConnection();
    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Cleanup previous transaction listener
      if (txUnsubscribeRef.current) {
        txUnsubscribeRef.current();
        txUnsubscribeRef.current = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
            
            // Setup real-time transactions
            const txQuery = query(
              collection(db, 'transactions'),
              where('userId', '==', firebaseUser.uid),
              orderBy('timestamp', 'desc')
            );
            txUnsubscribeRef.current = onSnapshot(txQuery, (snap) => {
              setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
            }, (error) => {
              console.error("Firestore Transaction Listener Error:", error);
            });

            if (currentView === 'splash' || currentView === 'login' || currentView === 'nid' || currentView === 'onboarding') {
              setCurrentView('dashboard');
            }
          } else {
            setCurrentView('nid');
          }
        } catch (error) {
          console.error("Profile fetch error:", error);
          if (currentView === 'splash') setCurrentView('login');
        }
      } else {
        // GUEST MODE: Auto-log in for preview
        setUser({ uid: 'guest-preview', email: 'guest@keystone.ai' } as User);
        setProfile({
          uid: 'guest-preview',
          name: 'Preview User',
          phoneNumber: '+88000000000',
          businessName: 'Keystone Demo Farm',
          businessCategory: 'Poultry',
          trustScore: 875,
          createdAt: new Date().toISOString(),
          isVerified: true,
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
        });
        
        if (currentView === 'splash' || currentView === 'login') {
          setTimeout(() => setCurrentView('dashboard'), currentView === 'splash' ? 2500 : 0);
        }
      }
      setLoading(false);
    });

    return () => {
      authUnsubscribe();
      if (txUnsubscribeRef.current) txUnsubscribeRef.current();
    };
  }, []);

  if (loading && currentView === 'splash') {
    return <SplashView onComplete={() => setCurrentView('login')} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'splash': return <SplashView onComplete={() => setCurrentView('login')} />;
      case 'login': return <LoginView setLanguage={(l) => setLang(l)} lang={lang} darkMode={darkMode} />;
      case 'nid': return <NidScanner onComplete={() => setCurrentView('onboarding')} lang={lang} darkMode={darkMode} />;
      case 'onboarding': return <Onboarding onComplete={() => setCurrentView('dashboard')} lang={lang} darkMode={darkMode} />;
      case 'settings': return <SettingsView setView={setCurrentView} lang={lang} profile={profile} darkMode={darkMode} setDarkMode={setDarkMode} setLang={setLang} pushNotificationsEnabled={pushNotificationsEnabled} setPushNotificationsEnabled={setPushNotificationsEnabled} />;
      case 'khata': return <KhataView setView={setCurrentView} lang={lang} profile={profile} darkMode={darkMode} />;
      case 'receipt': return <ReceiptScanner setView={setCurrentView} lang={lang} profile={profile} darkMode={darkMode} />;
      case 'challan': return <ChallanGenerator setView={setCurrentView} lang={lang} profile={profile} darkMode={darkMode} />;
      case 'rates': return <ExploreView setView={setCurrentView} lang={lang} darkMode={darkMode} />;
      case 'profile': return <ProfileView setView={setCurrentView} profile={profile} lang={lang} darkMode={darkMode} />;
      case 'transactions': return <TransactionsView setView={setCurrentView} lang={lang} profile={profile} darkMode={darkMode} />;
      case 'reports': return <ReportGenerationView setView={setCurrentView} lang={lang} transactions={transactions} darkMode={darkMode} />;
      case 'services': return <ServicesView setView={setCurrentView} lang={lang} darkMode={darkMode} />;
      case 'loan_predictor': return <LoanPredictorView setView={setCurrentView} lang={lang} transactions={transactions} profile={profile} darkMode={darkMode} />;
      default: return <Dashboard setView={setCurrentView} profile={profile} lang={lang} transactions={transactions} darkMode={darkMode} />;
    }
  };

  return (
    <div className={cn(
      "min-h-screen font-sans transition-colors duration-500 overflow-hidden",
      darkMode ? "bg-[#0A0A0B] text-white dark" : "bg-[#F5F5F7] text-[#1D1D1F]"
    )}>
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 left-4 right-4 z-[100] max-w-md mx-auto"
          >
             <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-3xl shadow-2xl flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                   <Bell className="text-white" size={20} />
                </div>
                <div className="flex-1">
                   <p className="text-sm font-bold">{notification.title}</p>
                   <p className="text-xs opacity-70">{notification.body}</p>
                </div>
                <button onClick={() => setNotification(null)} className="p-2 opacity-50 hover:opacity-100">
                   <X size={16} />
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
           key={currentView}
           initial={{ opacity: 0, scale: 0.98 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 1.02 }}
           transition={{ duration: 0.3, ease: 'easeInOut' }}
           className="w-full h-screen max-w-md mx-auto relative overflow-hidden"
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

