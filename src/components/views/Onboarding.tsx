import React, { useState } from 'react';
import { motion } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { TRANSLATIONS } from '../../constants';
import { Language } from '../../types';
import { Building2, MapPin, Tag, ArrowRight, LayoutGrid, Tractor, Milk } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Onboarding({ onComplete, lang, darkMode }: { onComplete: () => void, lang: Language, darkMode?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: '',
    category: 'Poultry',
    location: ''
  });
  const t = TRANSLATIONS[lang];

  const categories = [
    { id: 'Poultry', icon: <img src="https://api.iconify.design/noto:chicken.svg" className="w-8 h-8" alt="Poultry" />, label: t.poultry },
    { id: 'Agro', icon: <Tractor className={cn("w-8 h-8", darkMode ? "text-green-400" : "text-green-600")} />, label: t.agro },
    { id: 'Dairy', icon: <Milk className={cn("w-8 h-8", darkMode ? "text-blue-400" : "text-blue-600")} />, label: t.dairy },
    { id: 'Other', icon: <LayoutGrid className={cn("w-8 h-8", darkMode ? "text-zinc-500" : "text-gray-500")} />, label: t.other },
  ];

  const handleFinish = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        ...form,
        onboarded: true
      });
      onComplete();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col h-full p-6 transition-colors duration-300", 
      darkMode ? "bg-zinc-950 text-white" : "bg-white text-gray-900")}>
      <div className="mt-8 mb-12">
        <h2 className="text-3xl font-bold leading-tight">{t.farmSetup}</h2>
        <p className={cn("mt-2 transition-colors", darkMode ? "text-zinc-500" : "text-gray-500")}>Let's build your digital identity.</p>
      </div>

      <div className="flex-1 space-y-8">
        <div className="space-y-4">
          <label className={cn("text-sm font-bold uppercase tracking-widest flex items-center gap-2 transition-colors",
            darkMode ? "text-zinc-500" : "text-gray-400")}>
            <Building2 size={16} /> {t.businessName}
          </label>
          <input 
            className={cn("w-full text-2xl font-semibold border-b-2 outline-none pb-2 transition-all",
              darkMode ? "bg-transparent border-zinc-800 text-white focus:border-blue-500" : "bg-transparent border-gray-100 text-gray-900 focus:border-blue-600")}
            placeholder="e.g. Rahim Poultry"
            value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
          />
        </div>

        <div className="space-y-4">
          <label className={cn("text-sm font-bold uppercase tracking-widest flex items-center gap-2 transition-colors",
            darkMode ? "text-zinc-500" : "text-gray-400")}>
            <Tag size={16} /> {t.category}
          </label>
          <div className="grid grid-cols-2 gap-3">
             {categories.map((cat) => (
               <button
                 key={cat.id}
                 onClick={() => setForm({ ...form, category: cat.id })}
                 className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                    form.category === cat.id 
                      ? (darkMode ? "border-blue-500 bg-blue-500/10" : "border-[#1D4ED8] bg-blue-50/50") 
                      : (darkMode ? "border-zinc-800 bg-transparent" : "border-gray-100 bg-gray-50")
                 )}
               >
                 {cat.icon}
                 <span className={cn("font-bold transition-colors", 
                   form.category === cat.id 
                    ? (darkMode ? "text-blue-400" : "text-[#1D4ED8]") 
                    : (darkMode ? "text-zinc-500" : "text-gray-600")
                 )}>
                    {cat.label}
                 </span>
               </button>
             ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className={cn("text-sm font-bold uppercase tracking-widest flex items-center gap-2 transition-colors",
            darkMode ? "text-zinc-500" : "text-gray-400")}>
            <MapPin size={16} /> {t.location}
          </label>
          <input 
            className={cn("w-full text-lg font-semibold border-b-2 outline-none pb-2 transition-all",
              darkMode ? "bg-transparent border-zinc-800 text-white focus:border-blue-500" : "bg-transparent border-gray-100 text-gray-900 focus:border-blue-600")}
            placeholder="e.g. Tongi, Gazipur"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>
      </div>

      <button 
         disabled={loading || !form.businessName || !form.location}
         onClick={handleFinish}
         className="w-full bg-[#1D4ED8] text-white py-5 rounded-2xl font-bold text-xl shadow-xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 mt-12 mb-8"
      >
        {loading ? <RefreshCw className="animate-spin" /> : <>{t.next} <ArrowRight /></>}
      </button>
    </div>
  );
}

function RefreshCw(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}
