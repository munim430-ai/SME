import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Language, Transaction, Ledger } from '../../types';
import { TRANSLATIONS } from '../../constants';
import { 
  Plus, 
  Camera, 
  FileText, 
  BarChart2, 
  Home, 
  Book, 
  Package, 
  User as UserIcon, 
  Bell, 
  ChevronRight,
  Search,
  LogOut,
  UserCircle,
  Landmark,
  Building2,
  Wallet,
  History,
  CreditCard,
  CircleDollarSign,
  ArrowLeftRight,
  SmartphoneNfc,
  Cpu,
  Star,
  Mic,
  LayoutGrid,
  Map,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { isBefore } from 'date-fns';
import { calculateCreditScore, getCreditStatus } from '../../lib/creditScore';
import { InventoryItem } from '../../types';
import Skeleton from '../ui/Skeleton';

interface Props {
  profile: UserProfile | null;
  lang: Language;
  setView: (view: any) => void;
  transactions?: Transaction[];
  darkMode?: boolean;
}

export default function Dashboard({ profile, lang, setView, transactions = [], darkMode }: Props) {
  const t = TRANSLATIONS[lang];
  const [showScore, setShowScore] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const creditScore = calculateCreditScore(transactions);
  const creditStatus = getCreditStatus(creditScore);

  useEffect(() => {
    const fetchData = async () => {
      const uid = auth.currentUser?.uid || profile?.uid;
      if (!uid || uid === 'guest-preview') {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Fetch recent transactions
        const q = query(
          collection(db, 'transactions'),
          where('userId', '==', uid),
          orderBy('timestamp', 'desc'),
          limit(5)
        );
        const snap = await getDocs(q);
        setActivities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch low stock inventory
        const invQ = query(collection(db, 'inventory'), where('ownerId', '==', uid));
        const invSnap = await getDocs(invQ);
        const allItems = invSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
        setLowStockItems(allItems.filter(item => item.quantity <= item.minStock));

        // Fetch ledgers for global search
        const ledgerQ = query(collection(db, 'ledgers'), where('ownerId', '==', uid));
        const ledgerSnap = await getDocs(ledgerQ);
        setLedgers(ledgerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ledger)));

      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [profile, transactions.length]);

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="flex items-center gap-4 my-8 transition-colors">
      <span className={cn("font-bold text-sm shrink-0 uppercase tracking-widest transition-colors", 
        darkMode ? "text-red-400" : "text-red-800")}>{title}</span>
      <div className={cn("h-[1px] flex-1 transition-colors", 
        darkMode ? "bg-zinc-800" : "bg-gray-200")}></div>
    </div>
  );

  const CircleAction = ({ 
    icon, 
    label, 
    onClick, 
    color,
    iconColor,
    labelColor
  }: { 
    icon: any, 
    label: string, 
    onClick?: () => void, 
    color?: string,
    iconColor?: string,
    labelColor?: string
  }) => (
    <motion.button 
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="flex flex-col items-center gap-3 group w-full"
    >
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-105 shadow-inner border",
        color || (darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-100")
      )}>
        {React.cloneElement(icon, { 
          size: 24, 
          className: iconColor || (darkMode ? "text-zinc-400" : "text-blue-600") 
        })}
      </div>
      <span className={cn("text-[10px] font-black uppercase tracking-widest text-center px-1 transition-colors", 
        labelColor || (darkMode ? "text-zinc-600" : "text-gray-500"))}>
        {label}
      </span>
    </motion.button>
  );

  return (
    <div className={cn("flex flex-col h-full overflow-y-auto pb-32 transition-colors duration-300", 
      darkMode ? "bg-zinc-950" : "bg-[#F5F5F7]")}>
      {/* Premium Header */}
      <div className={cn("rounded-b-[40px] pt-12 pb-12 px-6 text-white relative overflow-hidden transition-all duration-500",
        darkMode ? "bg-zinc-900 border-b border-white/5" : "bg-gradient-to-b from-[#1D4ED8] to-[#1e40af]")}>
        <div className="flex items-center justify-between mb-10 z-10 relative">
          <div className="flex items-center gap-3">
             <div className={cn("w-14 h-14 rounded-full flex items-center justify-center border backdrop-blur-md transition-colors",
               darkMode ? "bg-white/5 border-white/10" : "bg-white/20 border-white/30")}>
                {loading ? (
                   <div className="w-full h-full rounded-full bg-white/10 animate-pulse" />
                ) : profile?.photoURL ? (
                  <img src={profile.photoURL} alt="p" className="w-full h-full rounded-full object-cover shadow-2xl shadow-black/20" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-xl font-bold">{profile?.name?.[0] || 'U'}</span>
                )}
             </div>
             <div>
                <p className="text-[10px] uppercase font-black tracking-widest text-blue-100/60 transition-colors">Business Account</p>
                {loading ? (
                   <Skeleton className="h-5 w-24 bg-white/20" />
                ) : (
                   <p className="text-lg font-black tracking-tight">{profile?.name || 'User'}</p>
                )}
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSearch(true)}
              className="p-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-sm"
            >
              <Search size={18} />
            </button>
            <button className="p-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-sm relative">
              <Bell size={18} />
              <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
            </button>
            {auth.currentUser && (
              <button onClick={() => auth.signOut()} className="p-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-sm"><LogOut size={18} /></button>
            )}
          </div>
        </div>

        {/* Top Feature Row */}
        <div className="grid grid-cols-3 gap-4 z-10 relative px-2">
          <CircleAction 
            color="bg-white/10 backdrop-blur-md border-white/20" 
            iconColor="text-white"
            labelColor="text-blue-50"
            icon={<Landmark />} 
            label="Bank Transfer" 
          />
          <CircleAction 
            color="bg-white/10 backdrop-blur-md border-white/20" 
            iconColor="text-white"
            labelColor="text-blue-50"
            icon={<Wallet />} 
            label="Digital Wallet" 
          />
          <CircleAction 
            color="bg-white/10 backdrop-blur-md border-white/20" 
            iconColor="text-white"
            labelColor="text-blue-50"
            icon={<CreditCard />} 
            label="Cards" 
          />
        </div>

        {/* Decorative elements */}
        <div className="absolute top-[-10%] right-[-10%] w-60 h-60 bg-blue-400 opacity-20 blur-[80px] rounded-full"></div>
      </div>

      <div className="px-6 py-8 flex-1">
        {/* Financial Overview Summary */}
        <div className="grid grid-cols-2 gap-4 mb-10">
            <div className={cn("p-5 rounded-[32px] border shadow-sm transition-colors", 
              darkMode ? "bg-white/5 border-white/5" : "bg-green-50 border-green-100")}>
                <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1 italic", darkMode ? "text-green-500" : "text-green-600")}>Income Flow</p>
                {loading ? (
                   <Skeleton className={cn("h-6 w-24", darkMode ? "bg-white/10" : "bg-green-200")} />
                ) : (
                   <p className={cn("text-2xl font-black italic tracking-tighter", darkMode ? "text-white" : "text-zinc-900")}>Tk {transactions.filter(t => t.type === 'SALE').reduce((a, b) => a + b.amount, 0).toLocaleString()}</p>
                )}
            </div>
            <div className={cn("p-5 rounded-[32px] border shadow-sm transition-colors",
              darkMode ? "bg-white/5 border-white/5" : "bg-red-50 border-red-100")}>
                <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1 italic", darkMode ? "text-red-500" : "text-red-600")}>Op-Expense</p>
                {loading ? (
                   <Skeleton className={cn("h-6 w-24", darkMode ? "bg-white/10" : "bg-red-200")} />
                ) : (
                   <p className={cn("text-2xl font-black italic tracking-tighter", darkMode ? "text-white" : "text-zinc-900")}>Tk {transactions.filter(t => t.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0).toLocaleString()}</p>
                )}
            </div>
            <div className={cn("col-span-2 p-6 rounded-[40px] border shadow-xl flex justify-between items-center transition-all",
              darkMode ? "bg-white/5 border-white/5 shadow-black/20" : "bg-orange-50 border-orange-100 shadow-orange-900/5")}>
                <div>
                   <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1 italic", darkMode ? "text-orange-500" : "text-orange-600")}>Collectable (Baki)</p>
                   <p className={cn("text-4xl font-black italic tracking-tighter", darkMode ? "text-white" : "text-zinc-900")}>Tk {transactions.filter(t => t.isBaki).reduce((a, b) => a + b.amount, 0).toLocaleString()}</p>
                </div>
                {transactions.filter(t => t.isBaki && t.dueDate && isBefore(new Date(t.dueDate), new Date())).length > 0 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setView('khata');
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 animate-bounce shadow-lg shadow-red-600/30 active:scale-95 transition-transform"
                  >
                     <AlertCircle size={14} strokeWidth={3} /> Remind Now
                  </button>
                )}
            </div>
        </div>

        {/* Trust Score / Quick Data */}
        <div className={cn("rounded-[40px] p-8 shadow-2xl mb-12 border transition-all relative overflow-hidden",
          darkMode ? "bg-zinc-900 border-white/5 shadow-black/40" : "bg-white border-gray-100 shadow-blue-900/5")}>
           {showScore && (
             <div className="absolute top-0 right-0 p-6 animate-in fade-in zoom-in slide-in-from-top-4">
               <div className={cn("px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-sm", creditStatus.color)}>
                 {creditStatus.label}
               </div>
             </div>
           )}
           <div className="flex items-center justify-between mb-8">
              <div 
                onClick={() => setShowScore(!showScore)}
                className="flex items-center gap-4 cursor-pointer group"
              >
                 <div className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-inner",
                   darkMode ? "bg-blue-600/10" : "bg-blue-50")}>
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                    </div>
                 </div>
                 <div className="flex flex-col">
                    <span className={cn("text-sm font-black uppercase tracking-widest transition-colors", darkMode ? "text-blue-400" : "text-blue-600")}>
                      {showScore ? `Score: ${creditScore}` : "Trust Score"}
                    </span>
                    {showScore && (
                      <p className={cn("text-[10px] font-bold leading-tight max-w-[180px] mt-1 opacity-60", darkMode ? "text-white" : "text-gray-500")}>
                        {creditStatus.description}
                      </p>
                    )}
                 </div>
              </div>
              <div className="text-right">
                <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-40", darkMode ? "text-white" : "text-gray-400")}>Revenue Flow</p>
                <p className={cn("text-2xl font-black italic tracking-tighter", darkMode ? "text-white" : "text-gray-900")}>Tk {transactions.filter(t => t.type === 'SALE').reduce((a, b) => a + b.amount, 0).toLocaleString()}</p>
              </div>
           </div>
           
           {/* Stock Alerts */}
           {lowStockItems.length > 0 && (
             <div className={cn("mb-8 p-5 border rounded-3xl flex items-center justify-between animate-pulse transition-colors",
               darkMode ? "bg-orange-500/10 border-orange-500/20" : "bg-orange-50 border-orange-100")}>
                <div className="flex items-center gap-4">
                   <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                     darkMode ? "bg-orange-600 text-white" : "bg-white text-orange-600 border border-orange-100")}>
                      <Package size={22} />
                   </div>
                   <div>
                      <p className={cn("text-[10px] font-black uppercase tracking-widest", darkMode ? "text-orange-500" : "text-orange-600")}>Stock Alert</p>
                      <p className={cn("text-xs font-black", darkMode ? "text-orange-200" : "text-orange-950")}>{lowStockItems.length} items low</p>
                   </div>
                </div>
                <button onClick={() => setView('management')} className={cn("w-10 h-10 rounded-full flex items-center justify-center shadow-sm border transition-colors",
                  darkMode ? "bg-orange-600 text-white border-orange-500" : "bg-white text-orange-600 border-orange-100")}><ChevronRight size={18} /></button>
             </div>
           )}

           <div className="flex gap-4">
              <button 
                onClick={() => setView('khata')} 
                className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-red-600/20 active:scale-95 transition-all"
              >
                Log Sale
              </button>
              <button 
                onClick={() => setView('transactions')} 
                className={cn("flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all border",
                  darkMode ? "bg-white/5 border-white/10 text-white" : "bg-[#F5F5F7] border-gray-100 text-gray-700")}
              >
                Analytics
              </button>
           </div>
        </div>

        {/* Section: Business Ledger */}
        <SectionHeader title="Business Ledger" />
        <div className="grid grid-cols-3 gap-y-8 gap-x-2">
          <CircleAction icon={<UserCircle />} label="Khata / CRM" onClick={() => setView('khata')} />
          <CircleAction icon={<Landmark />} label="Bank Transfer" />
          <CircleAction icon={<Building2 />} label="Other Bank" />
          <CircleAction icon={<Wallet />} label="Digital Pay" onClick={() => setView('receipt')} />
          <CircleAction icon={<History />} label="Tx History" onClick={() => setView('transactions')} />
          <CircleAction icon={<FileText />} label="Reports" onClick={() => setView('reports')} />
        </div>

        {/* Promo Banner Slider */}
        <div className="my-10 h-40 rounded-3xl overflow-hidden relative group">
           <img 
             src="https://picsum.photos/seed/keystone-growth/800/400" 
             alt="Banner" 
             className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
             referrerPolicy="no-referrer"
           />
           <div className="absolute inset-0 bg-gradient-to-r from-blue-900/60 to-transparent p-6 flex flex-col justify-center">
              <p className="text-white font-black text-lg tracking-tight leading-tight">Grow Your Poultry <br/> Business Faster.</p>
              <p className="text-blue-100/80 text-[10px] font-bold mt-2 uppercase tracking-widest italic">Check Market Rates & Tips</p>
           </div>
           <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 focus">
              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
           </div>
        </div>

        {/* Section: Farmer's Toolbox */}
        <SectionHeader title="Farmer's Toolbox" />
        <div className="grid grid-cols-3 gap-y-8 gap-x-2">
          <CircleAction icon={<BarChart2 />} label="Market Rates" onClick={() => setView('rates')} />
          <CircleAction icon={<History />} label="Production Log" onClick={() => setView('production_log')} />
          <CircleAction icon={<Package />} label="Stock Audit" onClick={() => setView('stock_audit')} />
          <CircleAction icon={<Map />} label="Nearby Dealers" onClick={() => setView('rates')} />
          <CircleAction icon={<Book />} label="Agro Guide" onClick={() => setView('agro_guide')} />
          <CircleAction icon={<CircleDollarSign />} label="Loan Predictor" onClick={() => setView('loan_predictor')} />
        </div>

        {/* Floating Voice Assistant Button */}
        <button 
          onClick={() => setView('voice_assistant')}
          className="fixed bottom-28 right-6 w-14 h-14 bg-gradient-to-tr from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 active:scale-90 transition-transform"
        >
           <Mic size={24} />
        </button>
      </div>

      {/* Modern Center-Action Bottom Nav */}
      <div className={cn("fixed bottom-0 left-0 right-0 max-w-md mx-auto backdrop-blur-xl border-t flex justify-around items-center py-4 pb-8 z-50 rounded-t-[32px] px-2 transition-colors",
        darkMode ? "bg-zinc-900/95 border-white/5" : "bg-white/95 border-gray-100")}>
         <NavItem onClick={() => setView('dashboard')} icon={<Home />} label="Home" active darkMode={darkMode} />
         <NavItem onClick={() => setView('services')} icon={<LayoutGrid />} label="Services" darkMode={darkMode} />
         
         <div className="relative -top-6">
            <button 
              onClick={() => setView('receipt')}
              className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-2xl active:scale-95 transition-all border-4",
                darkMode ? "bg-zinc-800 border-zinc-950 shadow-black/40" : "bg-red-800 border-[#F5F5F7] shadow-red-900/40")}
            >
               <Camera size={28} />
            </button>
         </div>

         <NavItem onClick={() => setView('rates')} icon={<Map />} label="Explore" darkMode={darkMode} />
         <NavItem onClick={() => setView('profile')} icon={<UserIcon />} label="Profile" darkMode={darkMode} />
      </div>

      <AnimatePresence>
        {showSearch && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex flex-col pt-12 px-6 shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                <input 
                  autoFocus
                  placeholder="Search transactions, buyers, stock..."
                  className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:ring-1 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-8 pb-32">
              {searchQuery.length > 0 ? (
                <>
                  {ledgers.filter(l => l.buyerName.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2">Buyers & Customers</p>
                      {ledgers.filter(l => l.buyerName.toLowerCase().includes(searchQuery.toLowerCase())).map(l => (
                        <div 
                          key={l.id} 
                          onClick={() => {
                            setView('khata');
                            setShowSearch(false);
                          }}
                          className="bg-white/5 border border-white/10 p-4 rounded-3xl flex items-center justify-between shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold">
                              {l.buyerName[0]}
                            </div>
                            <p className="font-bold text-white">{l.buyerName}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-sm font-black text-red-400">Tk {l.totalDue.toLocaleString()}</p>
                             <p className="text-[8px] font-black uppercase opacity-40">Baki</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {transactions.filter(t => t.description.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2">Transactions</p>
                      {transactions.filter(t => t.description.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5).map(t => (
                        <div 
                          key={t.id}
                          onClick={() => {
                            setView('transactions');
                            setShowSearch(false);
                          }}
                          className="bg-white/5 border border-white/10 p-4 rounded-3xl flex items-center justify-between shadow-sm"
                        >
                          <div>
                            <p className="font-bold text-white">{t.description}</p>
                            <p className="text-[10px] opacity-40">{new Date(t.timestamp).toLocaleDateString()}</p>
                          </div>
                          <p className={cn("font-black italic", t.type === 'SALE' ? "text-green-400" : "text-red-400")}>
                            Tk {t.amount.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchQuery.length > 0 && ledgers.filter(l => l.buyerName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && transactions.filter(t => t.description.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <div className="text-center py-20 opacity-40">
                      <Search size={48} className="mx-auto mb-4" />
                      <p className="font-black italic text-xl">No results found</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20 opacity-40">
                  <p className="text-sm font-bold">Search business records</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, darkMode }: { icon: any, label: string, active?: boolean, onClick?: () => void, darkMode?: boolean }) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center gap-1.5 min-w-[64px] transition-all", 
      active ? "text-blue-600 scale-110" : (darkMode ? "text-zinc-500 hover:text-zinc-300" : "text-gray-400 hover:text-blue-400"))}>
       {React.cloneElement(icon, { size: 22, strokeWidth: active ? 2.5 : 2 })}
       <span className={cn("text-[9px] font-black uppercase tracking-widest", active ? "opacity-100" : "opacity-40")}>{label}</span>
       {active && (
         <motion.div 
           layoutId="navTab"
           className="absolute -bottom-8 w-8 h-1 bg-blue-600 rounded-t-full"
         />
       )}
    </button>
  );
}

