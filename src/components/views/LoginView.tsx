import React, { useState } from 'react';
import { motion } from 'motion/react';
import { auth } from '../../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Language } from '../../types';
import { TRANSLATIONS } from '../../constants';
import { cn } from '../../lib/utils';
import { LogIn, Phone } from 'lucide-react';

interface Props {
  lang: Language;
  setLanguage: (lang: Language) => void;
  darkMode?: boolean;
}

export default function LoginView({ lang, setLanguage, darkMode }: Props) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const t = TRANSLATIONS[lang];

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={cn("flex flex-col h-full transition-colors duration-300 p-6", 
      darkMode ? "bg-zinc-950 text-white" : "bg-white text-[#1D1D1F]")}>
      <div className="flex justify-end gap-2 mb-12">
        <button 
          onClick={() => setLanguage('en')} 
          className={cn("text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all", 
            lang === 'en' 
              ? (darkMode ? "bg-white text-zinc-950 shadow-lg shadow-white/5" : "bg-zinc-900 text-white") 
              : (darkMode ? "bg-white/5 text-zinc-500" : "bg-gray-100 text-gray-400"))}
        >
          English
        </button>
        <button 
          onClick={() => setLanguage('bn')} 
          className={cn("text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all", 
            lang === 'bn' 
              ? (darkMode ? "bg-white text-zinc-950 shadow-lg shadow-white/5" : "bg-zinc-900 text-white") 
              : (darkMode ? "bg-white/5 text-zinc-500" : "bg-gray-100 text-gray-400"))}
        >
          বাংলা
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center -mt-12">
        <div className={cn("w-20 h-20 rounded-[28px] flex items-center justify-center mb-8 shadow-2xl transition-all",
          darkMode ? "bg-blue-600 shadow-blue-900/40" : "bg-[#1D4ED8] shadow-blue-100")}>
           <div className="text-white text-3xl font-black italic tracking-tighter">K</div>
        </div>
        <h2 className="text-3xl font-black italic mb-2 tracking-tight">{t.welcome}</h2>
        <p className={cn("font-medium mb-12 transition-colors", darkMode ? "text-zinc-500" : "text-gray-500")}>{t.chooseLanguage}</p>

        <div className="w-full space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className={cn("text-sm font-black transition-colors", darkMode ? "text-zinc-500" : "text-gray-400")}>+880</span>
            </div>
            <input 
              type="tel" 
              className={cn("w-full border rounded-2xl py-5 pl-16 pr-4 focus:ring-1 outline-none transition-all font-bold",
                darkMode 
                  ? "bg-white/5 border-white/5 text-white focus:ring-blue-500 placeholder:text-zinc-700" 
                  : "bg-gray-50 border-gray-100 text-zinc-900 focus:ring-blue-600 placeholder:text-gray-400")}
              placeholder="1XXX XXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <button 
             onClick={handleGoogleLogin}
             className={cn("w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all",
                darkMode ? "bg-blue-600 text-white shadow-blue-900/30" : "bg-[#1D4ED8] text-white shadow-blue-100")}
          >
            <LogIn size={20} />
            {t.next}
          </button>

          <div className="flex items-center gap-4 my-10">
            <div className={cn("flex-1 h-[1px] transition-colors", darkMode ? "bg-white/5" : "bg-gray-100")}></div>
            <span className={cn("text-[8px] font-black uppercase tracking-[0.3em] transition-colors", darkMode ? "text-zinc-700" : "text-gray-300")}>Secure Biometric Login</span>
            <div className={cn("flex-1 h-[1px] transition-colors", darkMode ? "bg-white/5" : "bg-gray-100")}></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className={cn("w-full border py-5 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-[0.98] transition-all",
              darkMode 
                ? "bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10" 
                : "bg-white border-gray-200 text-zinc-700 hover:bg-gray-50 shadow-sm")}
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Login with Google
          </button>
        </div>
      </div>
      
      <p className={cn("text-center text-[10px] font-medium mt-8 leading-relaxed transition-colors", darkMode ? "text-zinc-600" : "text-gray-400")}>
        By continuing, you agree to Keystone SME's <br />
        <span className={cn("underline font-black", darkMode ? "text-zinc-500" : "")}>Terms of Service</span> & <span className={cn("underline font-black", darkMode ? "text-zinc-500" : "")}>Privacy Policy</span>
      </p>
    </div>
  );
}
