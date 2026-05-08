import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  User, 
  Bell, 
  Moon, 
  Sun, 
  Contrast, 
  Languages, 
  Shield, 
  Lock, 
  HelpCircle, 
  Info, 
  LogOut, 
  ChevronRight,
  Database,
  Trash2,
  Headset,
  FileText,
  Smartphone,
  Check,
  Type
} from 'lucide-react';
import { UserProfile, Language } from '../../types';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { cn } from '../../lib/utils';

interface Props {
  setView: (view: any) => void;
  lang: Language;
  profile: UserProfile | null;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  setLang: (lang: Language) => void;
  pushNotificationsEnabled: boolean;
  setPushNotificationsEnabled: (value: boolean) => void;
}

export default function SettingsView({ setView, lang, profile, darkMode, setDarkMode, setLang, pushNotificationsEnabled, setPushNotificationsEnabled }: Props) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleLogout = () => {
    signOut(auth);
    setView('login');
  };

  const sections = [
    {
      id: 'account',
      title: 'Account & Profile',
      icon: <User className="text-blue-500" />,
      items: [
        { label: 'Edit Profile', onClick: () => setView('profile'), desc: 'Name, email, and business info' },
        { label: 'Payment Methods', onClick: () => {}, desc: 'Manage your connected accounts' },
        { label: 'Security & Password', onClick: () => {}, desc: 'Update password & social logins' }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <Bell className="text-orange-500" />,
      items: [
        { 
          label: 'Push Notifications', 
          type: 'toggle', 
          active: pushNotificationsEnabled, 
          onClick: () => setPushNotificationsEnabled(!pushNotificationsEnabled) 
        },
        { label: 'Transactional Alerts', type: 'toggle', active: true },
        { label: 'Marketing Offers', type: 'toggle', active: false }
      ]
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: <Contrast className="text-purple-500" />,
      items: [
        { 
          label: 'Theme Mode', 
          type: 'custom', 
          content: (
            <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
               <button 
                onClick={() => setDarkMode(false)} 
                className={cn("flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest", !darkMode ? "bg-white text-zinc-900 shadow-sm" : "text-gray-500")}
               >
                  <Sun size={14} /> Light
               </button>
               <button 
                onClick={() => setDarkMode(true)} 
                className={cn("flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest", darkMode ? "bg-zinc-900 text-white shadow-sm" : "text-gray-400")}
               >
                  <Moon size={14} /> Dark
               </button>
            </div>
          )
        },
        {
          label: 'Language',
          type: 'custom',
          content: (
            <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
               <button 
                onClick={() => setLang('en')} 
                className={cn("flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest", lang === 'en' ? "bg-white text-zinc-900 shadow-sm" : "text-gray-500")}
               >
                  English
               </button>
               <button 
                onClick={() => setLang('bn')} 
                className={cn("flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest", lang === 'bn' ? "bg-zinc-900 text-white shadow-sm" : "text-gray-400 font-bn")}
               >
                  বাংলা (BN)
               </button>
            </div>
          )
        },
        { label: 'Font Size', icon: <Type size={16} />, onClick: () => {}, desc: 'Standard System' }
      ]
    },
    {
      id: 'privacy',
      title: 'Privacy & Permissions',
      icon: <Shield className="text-green-500" />,
      items: [
        { label: 'Location Access', type: 'status', value: 'Authorized', color: 'text-green-500' },
        { label: 'Camera Permission', type: 'status', value: 'Authorized', color: 'text-green-500' },
        { label: 'Privacy Policy', onClick: () => {}, icon: <FileText size={16} /> },
        { label: 'Terms of Service', onClick: () => {}, icon: <FileText size={16} /> }
      ]
    },
    {
      id: 'support',
      title: 'Support & Help',
      icon: <Headset className="text-indigo-500" />,
      items: [
        { label: 'Help Center', onClick: () => {}, icon: <HelpCircle size={16} /> },
        { label: 'Contact Us', onClick: () => {}, icon: <Smartphone size={16} /> },
        { label: 'FAQs', onClick: () => {}, icon: <HelpCircle size={16} /> }
      ]
    },
    {
      id: 'system',
      title: 'General & System',
      icon: <Database className="text-zinc-500" />,
      items: [
        { label: 'Data Saving Mode', type: 'toggle', active: false },
        { label: 'Clear Cache', icon: <Trash2 size={16} />, onClick: () => {}, color: 'text-red-500' },
        { label: 'About', type: 'status', value: 'v1.0.4-beta' }
      ]
    }
  ];

  return (
    <div className={cn("h-full flex flex-col transition-colors", darkMode ? "bg-zinc-950 text-white" : "bg-[#F5F5F7] text-[#1D1D1F]")}>
      {/* Header */}
      <div className={cn("p-6 pt-12 flex items-center gap-4 sticky top-0 z-10 border-b shadow-sm transition-colors", darkMode ? "bg-zinc-900/80 border-white/5 backdrop-blur-xl" : "bg-white/80 border-gray-100 backdrop-blur-xl")}>
         <button onClick={() => setView('profile')} className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", darkMode ? "bg-white/5" : "bg-gray-50")}>
            <ChevronLeft size={24} />
         </button>
         <h2 className="text-xl font-black italic tracking-tight">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
         {sections.map((section) => (
           <div key={section.id} className="space-y-3">
              <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em] px-2", darkMode ? "text-zinc-500" : "text-gray-400")}>
                 {section.title}
              </h3>
              <div className={cn("rounded-[32px] overflow-hidden border shadow-sm transition-colors", darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-50")}>
                 {section.items.map((item, idx) => (
                   <div key={idx} className={cn("relative", idx !== section.items.length - 1 && (darkMode ? "border-b border-white/5" : "border-b border-gray-50"))}>
                     <button 
                      onClick={() => (!item.type || item.type === 'toggle') && item.onClick?.()}
                      className="w-full p-5 flex items-center justify-between group active:scale-[0.99] transition-transform"
                     >
                        <div className="flex items-center gap-4">
                           {item.icon && <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-white/5")}>{item.icon}</div>}
                           <div className="text-left">
                              <p className={cn("text-sm font-bold", item.color || "")}>{item.label}</p>
                              {item.desc && <p className={cn("text-[10px] font-medium", darkMode ? "text-zinc-500" : "text-gray-400")}>{item.desc}</p>}
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                           {item.type === 'toggle' && (
                             <div className={cn("w-10 h-6 rounded-full p-1 transition-colors", item.active ? "bg-green-500" : (darkMode ? "bg-white/10" : "bg-gray-200"))}>
                                <div className={cn("w-4 h-4 bg-white rounded-full shadow-sm transition-transform", item.active ? "translate-x-4" : "translate-x-0")} />
                             </div>
                           )}
                           {item.type === 'status' && (
                             <span className={cn("text-[10px] font-black uppercase tracking-widest", item.color || (darkMode ? "text-zinc-500" : "text-gray-400"))}>
                                {item.value}
                             </span>
                           )}
                           {!item.type && !item.onClick && <ChevronRight size={16} className="text-gray-300" />}
                           {item.onClick && !item.type && <ChevronRight size={16} className="text-gray-400" />}
                        </div>
                     </button>
                     {item.type === 'custom' && <div className="px-5 pb-5">{item.content}</div>}
                   </div>
                 ))}
              </div>
           </div>
         ))}

         <button 
           onClick={handleLogout}
           className="w-full p-6 bg-red-500/10 text-red-500 rounded-[32px] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 border border-red-500/20 active:bg-red-500/20 transition-colors mt-8"
         >
            <LogOut size={16} /> Logout of Keystone SME
         </button>
      </div>
    </div>
  );
}
