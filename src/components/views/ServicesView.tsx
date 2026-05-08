import React from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  Smartphone, 
  Zap, 
  Flame, 
  Droplets, 
  Shield, 
  LayoutGrid,
  CreditCard,
  DollarSign,
  Send,
  SmartphoneNfc,
  QrCode,
  Star,
  Search,
  Bell,
  Home,
  User as UserIcon,
  Map,
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  Archive
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Language } from '../../types';

interface Props {
  setView: (view: any) => void;
  lang: Language;
  darkMode?: boolean;
}

export default function ServicesView({ setView, lang, darkMode }: Props) {
  const categories = [
    {
      title: "UTILITIES & SERVICES",
      items: [
        { icon: <Smartphone />, label: "Phone Top-up", color: "text-blue-500", bg: "bg-blue-50", view: 'services' },
        { icon: <Zap />, label: "Electricity", color: "text-yellow-500", bg: "bg-yellow-50", view: 'services' },
        { icon: <Flame />, label: "Gas Bill", color: "text-orange-500", bg: "bg-orange-50", view: 'services' },
        { icon: <Droplets />, label: "Water Bill", color: "text-cyan-500", bg: "bg-cyan-50", view: 'services' },
        { icon: <Shield />, label: "Insurance", color: "text-emerald-500", bg: "bg-emerald-50", view: 'services' },
        { icon: <LayoutGrid />, label: "More Services", color: "text-zinc-400", bg: "bg-zinc-50", view: 'services' },
      ]
    },
    {
      title: "FINANCIAL TOOLS",
      items: [
        { icon: <CreditCard />, label: "Card Config", color: "text-purple-500", bg: "bg-purple-50", view: 'services' },
        { icon: <TrendingUp />, label: "Loan Predictor", color: "text-blue-600", bg: "bg-blue-50", view: 'loan_predictor' },
        { icon: <DollarSign />, label: "Micro Loans", color: "text-green-500", bg: "bg-green-50", view: 'services' },
        { icon: <Send />, label: "Fast Funds", color: "text-blue-600", bg: "bg-blue-50", view: 'services' },
        { icon: <SmartphoneNfc />, label: "NFC Pay", color: "text-indigo-500", bg: "bg-indigo-50", view: 'services' },
        { icon: <QrCode />, label: "Batch QR", color: "text-zinc-800", bg: "bg-zinc-50", view: 'services' },
        { icon: <Star />, label: "Reward", color: "text-amber-500", bg: "bg-amber-50", view: 'services' },
      ]
    },
    {
      title: "FARM MANAGEMENT",
      items: [
        { icon: <BookOpen />, label: "Agro Guide", color: "text-green-600", bg: "bg-green-50", view: 'agro_guide' },
        { icon: <Archive />, label: "Production Log", color: "text-blue-400", bg: "bg-blue-50", view: 'production_log' },
        { icon: <ClipboardCheck />, label: "Stock Audit", color: "text-amber-600", bg: "bg-amber-50", view: 'stock_audit' },
      ]
    }
  ];

  return (
    <div className={cn("h-full flex flex-col transition-colors duration-300", 
      darkMode ? "bg-zinc-950 text-white" : "bg-[#F5F5F7] text-[#1D1D1F]")}>
      {/* Header */}
      <div className="p-6 pt-12">
         <div className="flex items-center justify-between mb-8">
            <button onClick={() => setView('dashboard')} className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              darkMode ? "bg-white/5 hover:bg-white/10" : "bg-white border border-gray-100 shadow-sm")}>
               <ChevronLeft size={20} />
            </button>
            <h2 className={cn("text-xl font-black italic tracking-tight transition-colors", 
              darkMode ? "text-white" : "text-zinc-900")}>Services</h2>
            <div className="flex gap-2">
               <button className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                 darkMode ? "bg-white/5" : "bg-white border border-gray-100 shadow-sm")}>
                  <Search size={18} />
               </button>
               <button className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                 darkMode ? "bg-white/5" : "bg-white border border-gray-100 shadow-sm")}>
                  <Bell size={18} />
               </button>
            </div>
         </div>

         {/* Search Bar */}
         <div className="relative mb-8">
            <div className={cn("absolute inset-y-0 left-4 flex items-center pointer-events-none transition-colors",
              darkMode ? "text-zinc-500" : "text-gray-400")}>
               <Search size={16} />
            </div>
            <input 
              type="text" 
              placeholder="Search for a service..." 
              className={cn("w-full border rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:ring-1 transition-all",
                darkMode ? "bg-white/5 border-white/10 text-white focus:ring-blue-500 placeholder:text-zinc-600" : "bg-white border-gray-100 text-zinc-900 focus:ring-blue-500 placeholder:text-gray-400 shadow-sm")}
            />
         </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-40">
         {categories.map((cat, idx) => (
           <div key={idx} className="mb-10 last:mb-0">
              <div className="flex items-center gap-4 mb-6">
                 <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
                   darkMode ? "text-blue-500" : "text-blue-600")}>{cat.title}</h3>
                 <div className={cn("h-[1px] flex-1 transition-colors",
                   darkMode ? "bg-gradient-to-r from-blue-500/20 to-transparent" : "bg-gradient-to-r from-blue-100 to-transparent")}></div>
              </div>
              
              <div className="grid grid-cols-3 gap-y-8 gap-x-4">
                 {categories[idx].items.map((item: any, idy: number) => (
                   <motion.button
                     key={idy}
                     onClick={() => setView(item.view)}
                     whileHover={{ scale: 0.95 }}
                     whileTap={{ scale: 0.9 }}
                     className="flex flex-col items-center gap-3 transition-opacity active:opacity-70 group"
                   >
                     <div className={cn(
                       "w-16 h-16 rounded-[22px] flex items-center justify-center transition-all border",
                       darkMode ? "bg-white/5 border-white/5 shadow-2xl shadow-black/40" : "bg-white border-gray-100 shadow-sm"
                     )}>
                        <div className={cn("transition-transform group-hover:scale-110", item.color)}>
                           {React.cloneElement(item.icon as React.ReactElement<any>, { size: 24 })}
                        </div>
                     </div>
                     <span className={cn("text-[10px] font-black uppercase tracking-wider text-center leading-tight transition-colors",
                       darkMode ? "text-zinc-500 group-hover:text-white" : "text-gray-500 group-hover:text-zinc-900")}>
                        {item.label}
                     </span>
                   </motion.button>
                 ))}
              </div>
           </div>
         ))}
      </div>

      {/* Modern Center-Action Bottom Nav */}
      <div className={cn("fixed bottom-0 left-0 right-0 max-w-md mx-auto backdrop-blur-xl border-t flex justify-around items-center py-4 pb-8 z-50 rounded-t-[32px] px-2 transition-all",
        darkMode ? "bg-zinc-900/95 border-white/5 shadow-[0_-20px_40px_rgba(0,0,0,0.4)]" : "bg-white/95 border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]")}>
         <NavItem onClick={() => setView('dashboard')} icon={Home} label="Home" darkMode={darkMode} />
         <NavItem onClick={() => setView('services')} icon={LayoutGrid} label="Services" active darkMode={darkMode} />
         
         <div className="relative -top-6">
            <button 
              onClick={() => setView('receipt')}
              className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-2xl active:scale-95 transition-all border-4",
                darkMode ? "bg-zinc-800 border-zinc-950 shadow-black/40" : "bg-red-800 border-[#F5F5F7] shadow-red-900/40")}
            >
               <LayoutGrid size={28} />
            </button>
         </div>

         <NavItem onClick={() => setView('rates')} icon={Map} label="Explore" darkMode={darkMode} />
         <NavItem onClick={() => setView('profile')} icon={UserIcon} label="Profile" darkMode={darkMode} />
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick, darkMode }: { icon: any, label: string, active?: boolean, onClick?: () => void, darkMode?: boolean }) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center gap-1 min-w-[64px] transition-colors", 
      active 
        ? (darkMode ? "text-blue-400" : "text-blue-600") 
        : (darkMode ? "text-zinc-500" : "text-gray-400")
    )}>
       <Icon size={22} strokeWidth={active ? 2.5 : 2} />
       <span className={cn("text-[9px] font-bold uppercase tracking-wider transition-opacity", active ? "opacity-100" : "opacity-40")}>{label}</span>
    </button>
  );
}
