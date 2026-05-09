import React, { useState, useMemo } from 'react';

import { 
  Bell, Search, Plus, Home, Book, Camera, Receipt, User as UserIcon,
  ArrowUpRight, ArrowDownRight, ScanLine
} from 'lucide-react';
import { UserProfile, Language, Transaction } from '../../types';
import { cn } from '../../lib/utils';

export default function Dashboard({
  setView, profile, lang, transactions, darkMode
}: {
  setView: any,
  profile: UserProfile | null,
  lang: Language,
  transactions: Transaction[],
  darkMode: boolean
}) {
  const [showSearch, setShowSearch] = useState(false);

  // Calculate Ledger Balances
  const ledgerSummary = useMemo(() => {
    let totalDue = 0;
    let totalPaid = 0;
    transactions.forEach(t => {
      if (t.isBaki && t.type === 'SALE') totalDue += t.amount;
      if ((t.type === 'SALE' && !t.isBaki)) totalPaid += t.amount;
    });
    return { totalDue, totalPaid };
  }, [transactions]);

  return (
    <div className={cn(
      "min-h-screen font-sans pb-32 transition-colors",
      darkMode ? "bg-[#0A0A0B] text-white" : "bg-[#f8fafc] text-[#191c21]"
    )}>
      {/* Top Bar Component */}
      <header className={cn(
        "fixed top-0 w-full z-50 flex justify-between items-center px-4 h-14 max-w-md mx-auto border-b-2",
        darkMode ? "bg-[#1E1E1E] border-white/10" : "bg-white border-[#0F172A]"
      )}>
        <div className="flex items-center gap-2">
          <Book className="text-[#0056b3]" size={24} />
          <h1 className="font-bold text-lg text-[#0056b3]">
            {profile?.businessName || 'Keystone Poultry'}
          </h1>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full border-2 font-bold text-xs",
          darkMode ? "bg-blue-900/30 text-blue-400 border-blue-800" : "bg-[#bbd0ff] text-[#001a40] border-[#0F172A]"
        )}>
          Score: {profile?.trustScore || 850}
        </div>
      </header>

      <main className="pt-20 px-4 flex flex-col gap-6 max-w-md mx-auto">
        {/* Ledger Summary Card */}
        <section className={cn(
          "border-2 p-5 rounded-xl flex flex-col gap-4",
          darkMode ? "bg-[#1E1E1E] border-white/20" : "bg-white border-[#0F172A]"
        )}>
          <div className="flex justify-between items-center border-b pb-3 border-opacity-20 border-black">
            <span className="font-bold text-sm uppercase tracking-wider opacity-70">Business Overview</span>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col">
              <span className="font-bold text-sm text-[#ba1a1a]">Total Due</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-bold text-xl text-[#ba1a1a]">৳</span>
                <span className="font-bold text-2xl text-[#ba1a1a]">{ledgerSummary.totalDue.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-[#006e25]">Total Paid</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-bold text-xl text-[#006e25]">৳</span>
                <span className="font-bold text-2xl text-[#006e25]">{ledgerSummary.totalPaid.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </section>

        {/* OCR Hero Action */}
        <section>
          <button
            onClick={() => setView('receipt')}
            className="w-full bg-[#0056b3] border-2 border-[#0F172A] p-6 rounded-xl flex items-center justify-between group active:translate-y-1 transition-all shadow-[4px_4px_0px_0px_#0F172A] active:shadow-none"
          >
            <div className="flex items-center gap-4 text-white">
              <div className="bg-white/20 p-4 rounded-xl border-2 border-transparent">
                <ScanLine size={40} />
              </div>
              <div className="text-left">
                <h2 className="font-bold text-xl leading-tight">Scan Receipt / NID</h2>
                <p className="text-sm opacity-90 mt-1">Instant ledger entry via Camera</p>
              </div>
            </div>
          </button>
        </section>

        {/* Recent Activity */}
        <section className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-xl">Recent Activity</h2>
            <button onClick={() => setView('transactions')} className="text-[#0056b3] font-bold underline text-sm">View All</button>
          </div>
          <div className="flex flex-col gap-3">
            {transactions.slice(0, 3).map((t, i) => (
              <div 
                key={t.id || i}
                onClick={() => setView('transactions')}
                className={cn(
                  "border-2 p-4 rounded-xl flex justify-between items-center cursor-pointer active:translate-y-1 transition-all",
                  darkMode ? "bg-[#1E1E1E] border-white/20" : "bg-white border-[#0F172A]"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2 rounded-lg border-2",
                    t.type === 'SALE' ? "bg-[#80f98b] text-[#007327] border-[#0F172A]" : "bg-[#ffdad6] text-[#93000a] border-[#0F172A]"
                  )}>
                    {t.type === 'SALE' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-base">{t.description}</p>
                    <p className="font-bold text-xs opacity-60 mt-0.5">{new Date(t.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className={cn(
                  "font-bold text-lg",
                  t.type === 'SALE' ? "text-[#006e25]" : "text-[#ba1a1a]"
                )}>
                  {t.type === 'SALE' ? '+' : '-'} ৳ {t.amount.toLocaleString()}
                </p>
              </div>
            ))}
            {transactions.length === 0 && (
               <div className="text-center py-8 opacity-50 font-bold">No recent activity</div>
            )}
          </div>
        </section>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className={cn(
        "fixed bottom-0 w-full z-50 h-[80px] border-t-2 flex justify-around items-center px-4 pb-4 max-w-md mx-auto",
        darkMode ? "bg-[#1E1E1E] border-white/10" : "bg-white border-[#0F172A]"
      )}>
        {/* Khata Tab */}
        <button onClick={() => setView('khata')} className="flex flex-col items-center justify-center opacity-70 hover:opacity-100 h-14 w-20 active:translate-y-1 transition-all">
          <Book size={24} />
          <span className="font-bold text-[10px] mt-1">Khata</span>
        </button>

        {/* Scan (Active/Central) */}
        <button 
          onClick={() => setView('receipt')}
          className="flex flex-col items-center justify-center bg-[#0056b3] text-white rounded-xl h-14 w-20 border-2 border-[#0F172A] shadow-[2px_2px_0px_0px_#0F172A] active:translate-y-1 active:shadow-none transition-all -mt-4"
        >
          <Camera size={28} />
          <span className="font-bold text-[10px] mt-1">Scan</span>
        </button>

        {/* Challan Tab */}
        <button onClick={() => setView('challan')} className="flex flex-col items-center justify-center opacity-70 hover:opacity-100 h-14 w-20 active:translate-y-1 transition-all">
          <Receipt size={24} />
          <span className="font-bold text-[10px] mt-1">Challan</span>
        </button>
      </nav>
    </div>
  );
}
