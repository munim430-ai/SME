import React, { useState } from 'react';
import { motion } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { UserProfile, Language } from '../../types';
import { TRANSLATIONS } from '../../constants';
import { 
  User, 
  Building2, 
  Tag, 
  MapPin, 
  ChevronLeft, 
  Save, 
  LogOut, 
  ShieldCheck,
  CheckCircle2,
  Tractor,
  Milk,
  LayoutGrid,
  RefreshCw,
  Settings,
  Camera
} from 'lucide-react';
import { cn } from '../../lib/utils';
import PhotoUpload from '../PhotoUpload';
import { signOut } from 'firebase/auth';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface Props {
  profile: UserProfile | null;
  lang: Language;
  setView: (view: any) => void;
  darkMode?: boolean;
}

export default function ProfileView({ profile, lang, setView, darkMode }: Props) {
  const t = TRANSLATIONS[lang];
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    businessName: profile?.businessName || '',
    category: profile?.businessCategory || 'Poultry',
    location: profile?.location || '',
    photoURL: profile?.photoURL || ''
  });

  const categories = [
    { id: 'Poultry', icon: <img src="https://api.iconify.design/noto:chicken.svg" className="w-6 h-6" alt="Poultry" />, label: t.poultry },
    { id: 'Agro', icon: <Tractor className="w-6 h-6 text-green-600" />, label: t.agro },
    { id: 'Dairy', icon: <Milk className="w-6 h-6 text-blue-600" />, label: t.dairy },
    { id: 'Other', icon: <LayoutGrid className="w-6 h-6 text-gray-500" />, label: t.other },
  ];

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        name: formData.name,
        businessName: formData.businessName,
        businessCategory: formData.category,
        location: formData.location,
        photoURL: formData.photoURL,
        updatedAt: new Date().toISOString()
      });
      alert('Profile updated successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className={cn("flex flex-col h-full transition-colors duration-300", 
      darkMode ? "bg-zinc-950" : "bg-[#F5F5F7]")}>
      {/* Header */}
      <div className={cn("p-6 flex items-center justify-between sticky top-0 z-10 shadow-sm transition-colors duration-300 border-b",
        darkMode ? "bg-zinc-900 border-white/5" : "bg-white border-gray-100")}>
        <button onClick={() => setView('dashboard')} className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", 
          darkMode ? "bg-white/5 text-zinc-400" : "bg-gray-50 text-gray-500")}>
          <ChevronLeft size={24} />
        </button>
        <h2 className={cn("text-xl font-black italic tracking-tight transition-colors",
          darkMode ? "text-white" : "text-zinc-900")}>Profile & Settings</h2>
        <button onClick={() => setView('settings')} className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors",
          darkMode ? "bg-white/5 text-zinc-400" : "bg-gray-50 text-gray-500")}>
          <Settings size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
        {/* User Card */}
        <div className={cn("rounded-[32px] p-8 shadow-sm border transition-all flex flex-col items-center",
          darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-50")}>
            <div className="relative group">
                <div className={cn("w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-lg mb-4 relative transition-all overflow-hidden",
                  darkMode ? "bg-blue-600/10 border-zinc-800" : "bg-blue-50 border-white")}>
                    {formData.photoURL ? (
                      <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className={cn("text-3xl font-black", darkMode ? "text-blue-400" : "text-blue-600")}>{formData.name[0]?.toUpperCase() || 'U'}</span>
                    )}
                </div>
                <div className="absolute -bottom-1 -right-1">
                   <PhotoUpload 
                     darkMode={darkMode} 
                     onUpload={(url) => setFormData({...formData, photoURL: url})}
                     label=""
                     className="w-10 h-10 p-0"
                   />
                </div>
                {profile?.isVerified && !formData.photoURL && (
                    <div className={cn("absolute top-0 right-0 rounded-full p-1 shadow-sm transition-colors",
                      darkMode ? "bg-zinc-900" : "bg-white")}>
                        <CheckCircle2 className="text-blue-500" size={16} fill="currentColor" />
                    </div>
                )}
            </div>
            <h3 className={cn("text-xl font-bold transition-colors mt-2", darkMode ? "text-white" : "text-gray-900")}>{formData.name}</h3>
            <p className={cn("text-xs font-bold tracking-widest uppercase mt-1 transition-colors", 
              darkMode ? "text-zinc-500" : "text-gray-400")}>{profile?.phoneNumber}</p>
            
            <div className={cn("mt-6 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-colors",
              darkMode ? "bg-blue-600/10 text-blue-400" : "bg-blue-50 text-blue-600")}>
                <ShieldCheck size={16} />
                Trust Score: {profile?.trustScore || 0}
            </div>
        </div>

        {/* Edit Form */}
        <div className="space-y-6">
           <SectionLabel icon={<User size={16} />} title="Full Name" darkMode={darkMode} />
           <input 
              className={cn("w-full border rounded-2xl py-4 px-6 text-lg font-bold outline-none shadow-sm transition-all",
                darkMode ? "bg-white/5 border-white/5 text-white focus:ring-blue-500/40" : "bg-white border-gray-100 text-gray-900 focus:ring-blue-500") }
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
           />

           <SectionLabel icon={<Building2 size={16} />} title="Business Name" darkMode={darkMode} />
           <input 
              className={cn("w-full border rounded-2xl py-4 px-6 text-lg font-bold outline-none shadow-sm transition-all",
                darkMode ? "bg-white/5 border-white/5 text-white focus:ring-blue-500/40" : "bg-white border-gray-100 text-gray-900 focus:ring-blue-500") }
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
           />

           <SectionLabel icon={<Tag size={16} />} title="Business Category" darkMode={darkMode} />
           <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFormData({ ...formData, category: cat.id as any })}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                    formData.category === cat.id 
                      ? (darkMode ? "border-blue-500 bg-blue-500/10" : "border-[#1D4ED8] bg-blue-50/50") 
                      : (darkMode ? "border-white/5 bg-white/5" : "border-gray-50 bg-white")
                  )}
                >
                  {cat.icon}
                  <span className={cn("font-bold text-sm", 
                    formData.category === cat.id 
                      ? (darkMode ? "text-blue-400" : "text-[#1D4ED8]") 
                      : (darkMode ? "text-zinc-400" : "text-gray-600")
                  )}>
                    {cat.label}
                  </span>
                </button>
              ))}
           </div>

           <SectionLabel icon={<MapPin size={16} />} title="Location" darkMode={darkMode} />
           <input 
              className={cn("w-full border rounded-2xl py-4 px-6 text-lg font-bold outline-none shadow-sm transition-all",
                darkMode ? "bg-white/5 border-white/5 text-white focus:ring-blue-500/40" : "bg-white border-gray-100 text-gray-900 focus:ring-blue-500") }
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
           />

           <div className={cn("w-full h-64 rounded-[32px] overflow-hidden border shadow-inner relative mt-4 transition-colors",
             darkMode ? "bg-white/5 border-white/5" : "bg-gray-100 border-gray-50")}>
              {!hasValidKey ? (
                <div className={cn("w-full h-full flex flex-col items-center justify-center p-6 text-center transition-colors",
                  darkMode ? "bg-white/5" : "bg-gray-50")}>
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors",
                    darkMode ? "bg-white/5" : "bg-gray-200")}>
                    <MapPin className={cn("transition-colors", darkMode ? "text-zinc-500" : "text-gray-400")} size={24} />
                  </div>
                  <h4 className={cn("text-sm font-bold mb-1 transition-colors", darkMode ? "text-white" : "text-gray-900")}>Maps Access Required</h4>
                  <p className={cn("text-[10px] font-medium leading-relaxed max-w-[240px] transition-colors",
                    darkMode ? "text-zinc-500" : "text-gray-400")}>
                    To see your farm, please add your <code>GOOGLE_MAPS_PLATFORM_KEY</code> to settings (⚙️).
                  </p>
                  <a href="https://console.cloud.google.com/google/maps-apis/start" target="_blank" rel="noopener" className={cn("mt-4 text-[10px] font-black uppercase tracking-widest transition-colors", 
                    darkMode ? "text-blue-400" : "text-blue-600")}>
                    Get Key →
                  </a>
                </div>
              ) : (
                <APIProvider apiKey={API_KEY} version="weekly">
                  <Map
                    defaultCenter={{lat: 23.8103, lng: 90.4125}} // Dhaka center
                    defaultZoom={11}
                    mapId={darkMode ? "DARK_MAP_ID" : "DEMO_MAP_ID"}
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    style={{width: '100%', height: '100%'}}
                  >
                    <AdvancedMarker position={{lat: 23.8103, lng: 90.4125}}>
                      <Pin background="#1D4ED8" glyphColor="#fff" borderColor="#1D4ED8" />
                    </AdvancedMarker>
                  </Map>
                </APIProvider>
              )}
           </div>
        </div>

        <div className="pt-8 space-y-4">
           <button 
             onClick={handleSave}
             disabled={loading}
             className="w-full bg-[#1D4ED8] text-white py-5 rounded-3xl font-bold text-lg shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
           >
             {loading ? <RefreshCw className="animate-spin" /> : <><Save size={20} /> Update Profile</>}
           </button>

           <button 
             onClick={handleLogout}
             className={cn("w-full border py-5 rounded-3xl font-bold text-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all",
               darkMode ? "bg-white/5 border-red-500/20 text-red-400" : "bg-white border-red-50 text-red-500 active:bg-red-50") }
           >
             <LogOut size={20} /> Log Out
           </button>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ icon, title, darkMode }: { icon: any, title: string, darkMode?: boolean }) {
    return (
        <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 px-2 transition-colors",
          darkMode ? "text-zinc-500" : "text-gray-400")}>
            {icon} {title}
        </label>
    );
}
