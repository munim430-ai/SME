import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ClipboardCheck, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  Search,
  Package,
  ArrowRight,
  Plus,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, orderBy } from 'firebase/firestore';
import { UserProfile, Language, InventoryItem, StockAudit } from '../../types';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

export default function StockAuditView({ setView, lang, profile, darkMode }: { setView: (v: any) => void, lang: Language, profile: UserProfile | null, darkMode?: boolean }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [audits, setAudits] = useState<StockAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditItems, setAuditItems] = useState<{ itemId: string, itemName: string, systemQty: number, physicalQty: number }[]>([]);

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    const uid = auth.currentUser?.uid || profile?.uid;
    if (!uid || uid === 'guest-preview') {
      setLoading(false);
      return;
    }
    try {
      const invSnap = await getDocs(query(collection(db, 'inventory'), where('ownerId', '==', uid)));
      const auditSnap = await getDocs(query(collection(db, 'stock_audits'), where('ownerId', '==', uid), orderBy('date', 'desc')));
      
      setInventory(invSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)));
      setAudits(auditSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockAudit)));
    } catch (error) {
       console.error("Audit fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const startNewAudit = () => {
    setAuditItems(inventory.map(item => ({
      itemId: item.id,
      itemName: item.name,
      systemQty: item.quantity,
      physicalQty: item.quantity
    })));
    setIsAuditing(true);
  };

  const submitAudit = async () => {
    const uid = auth.currentUser?.uid || profile?.uid;
    if (!uid) return;
    try {
      await addDoc(collection(db, 'stock_audits'), {
        ownerId: uid,
        date: new Date().toISOString(),
        items: auditItems.map(item => ({
          ...item,
          difference: item.physicalQty - item.systemQty
        })),
        status: 'COMPLETED',
        updatedAt: new Date().toISOString()
      });
      setIsAuditing(false);
      fetchData();
    } catch (error) {
       console.error("Submit audit error:", error);
    }
  };

  return (
    <div className={cn("h-full flex flex-col transition-colors duration-300", 
      darkMode ? "bg-zinc-950 text-zinc-100" : "bg-[#F5F5F7] text-zinc-900")}>
      <div className={cn("p-6 pt-12 flex items-center justify-between sticky top-0 z-10 shadow-sm transition-colors",
        darkMode ? "bg-zinc-900 border-white/5" : "bg-white border-gray-100")}>
         <div className="flex items-center gap-4">
            <button onClick={() => setView('services')} className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm",
              darkMode ? "bg-white/5 text-zinc-400 hover:text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100")}>
               <ChevronLeft size={24} />
            </button>
            <h2 className={cn("text-xl font-black italic tracking-tight underline decoration-4 transition-all",
              darkMode ? "text-white decoration-blue-500" : "text-zinc-900 decoration-amber-500")}>Stock Audit</h2>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
         {!isAuditing ? (
            <div className="space-y-8">
               {/* Summary */}
               <div className="grid grid-cols-2 gap-4">
                  <div className={cn("p-6 rounded-[32px] border shadow-sm text-center transition-colors",
                    darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-50")}>
                     <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-2 transition-colors",
                       darkMode ? "text-zinc-500" : "text-gray-400")}>Inventory Health</p>
                     <p className="text-3xl font-black text-green-500">92%</p>
                     <p className={cn("text-[10px] font-bold mt-1 transition-colors",
                       darkMode ? "text-zinc-600" : "text-gray-400")}>Consistency Rating</p>
                  </div>
                  <div className={cn("p-6 rounded-[32px] border shadow-sm text-center transition-colors",
                    darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-100")}>
                     <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-2 transition-colors",
                       darkMode ? "text-zinc-500" : "text-gray-400")}>Total Items</p>
                     <p className={cn("text-3xl font-black transition-colors",
                       darkMode ? "text-white" : "text-zinc-900")}>{inventory.length}</p>
                     <p className={cn("text-[10px] font-bold mt-1 transition-colors",
                       darkMode ? "text-zinc-600" : "text-gray-400")}>SKUs Tracked</p>
                  </div>
               </div>

               {/* Start Button */}
               <button 
                 onClick={startNewAudit}
                 className={cn("w-full rounded-[32px] p-6 flex items-center justify-between shadow-2xl transition-all active:scale-95 group",
                   darkMode ? "bg-blue-600 text-zinc-100 shadow-blue-500/20" : "bg-zinc-900 text-white shadow-zinc-900/20")}>
                  <div className="text-left">
                     <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1 transition-colors",
                       darkMode ? "text-blue-200" : "text-zinc-500")}>Stock Verification</p>
                     <h3 className="text-xl font-black italic">Start New Audit</h3>
                  </div>
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors group-hover:scale-110",
                    darkMode ? "bg-white/20" : "bg-white/10")}>
                     <ClipboardCheck size={24} />
                  </div>
               </button>

               {/* History */}
               <div className="space-y-4">
                  <div className="flex items-center gap-4">
                     <h3 className={cn("text-xs font-black uppercase tracking-widest transition-colors",
                       darkMode ? "text-zinc-500" : "text-zinc-400")}>Audit History</h3>
                     <div className={cn("h-[1px] flex-1 transition-colors",
                       darkMode ? "bg-white/5" : "bg-gray-100")}></div>
                  </div>
                  
                  {audits.map(audit => (
                    <div key={audit.id} className={cn("p-5 rounded-3xl border shadow-sm transition-colors",
                      darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-100")}>
                       <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                             <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                               darkMode ? "bg-white/5 text-zinc-500" : "bg-gray-50 text-gray-400")}>
                                <History size={18} />
                             </div>
                             <div>
                                <p className={cn("text-[10px] font-black uppercase tracking-[0.1em] transition-colors",
                                  darkMode ? "text-zinc-600" : "text-gray-400")}>Verification Run</p>
                                <p className={cn("text-sm font-black italic transition-colors",
                                  darkMode ? "text-zinc-200" : "text-zinc-900")}>{format(new Date(audit.date), 'MMM dd, yyyy')}</p>
                             </div>
                          </div>
                          <div className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-colors",
                            darkMode ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600")}>
                             {audit.status}
                          </div>
                       </div>
                       <div className="flex gap-2">
                          {audit.items.slice(0, 3).map((item, i) => (
                            <div key={i} className={cn(
                              "flex-1 p-2 rounded-xl text-[9px] font-bold text-center border transition-colors",
                              item.difference === 0 
                                ? (darkMode ? "bg-white/5 border-white/5 text-zinc-500" : "bg-gray-50 border-gray-100 text-gray-500") 
                                : item.difference < 0 
                                  ? (darkMode ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-100 text-red-600") 
                                  : (darkMode ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-green-50 border-green-100 text-green-600")
                            )}>
                               {item.difference > 0 ? '+' : ''}{item.difference} {item.itemName.slice(0, 5)}...
                            </div>
                          ))}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         ) : (
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest text-amber-500">Live Verification</h3>
                  <button onClick={() => setIsAuditing(false)} className={cn("text-[10px] font-black uppercase transition-colors",
                    darkMode ? "text-red-400 hover:text-red-300" : "text-red-500 hover:text-red-600")}>Cancel</button>
               </div>

               <div className="space-y-3">
                  {auditItems.map((item, idx) => (
                    <div key={item.itemId} className={cn("p-5 rounded-[32px] border shadow-sm space-y-4 transition-colors",
                      darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-100")}>
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                               darkMode ? "bg-white/5 text-zinc-500" : "bg-gray-50 text-gray-400")}>
                                <Package size={20} />
                             </div>
                             <h4 className={cn("font-black italic transition-colors",
                               darkMode ? "text-white" : "text-gray-900")}>{item.itemName}</h4>
                          </div>
                          <div className="text-right">
                             <p className={cn("text-[8px] font-black uppercase transition-colors",
                               darkMode ? "text-zinc-600" : "text-gray-400")}>System Stock</p>
                             <p className={cn("text-sm font-black transition-colors",
                               darkMode ? "text-zinc-400" : "text-zinc-950")}>{item.systemQty}</p>
                          </div>
                       </div>
                       
                       <div className={cn("flex items-center gap-4 p-4 rounded-2xl transition-colors",
                         darkMode ? "bg-white/5" : "bg-gray-50")}>
                          <p className={cn("text-[10px] font-black uppercase shrink-0 transition-colors",
                            darkMode ? "text-zinc-500" : "text-gray-400")}>Physical Count:</p>
                          <input 
                            type="number"
                            className={cn("flex-1 bg-transparent text-xl font-black text-center outline-none transition-colors",
                              darkMode ? "text-white" : "text-zinc-900")}
                            value={item.physicalQty}
                            onChange={e => {
                              const newItems = [...auditItems];
                              newItems[idx].physicalQty = Number(e.target.value);
                              setAuditItems(newItems);
                            }}
                          />
                          <div className={cn(
                            "flex items-center gap-1 text-[10px] font-black transition-colors",
                            item.physicalQty - item.systemQty === 0 ? "text-gray-400" : item.physicalQty - item.systemQty < 0 ? "text-red-500" : "text-green-500"
                          )}>
                             {item.physicalQty - item.systemQty > 0 ? '+' : ''}{item.physicalQty - item.systemQty}
                             {item.physicalQty - item.systemQty === 0 ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                          </div>
                       </div>
                    </div>
                  ))}
               </div>

               <button 
                 onClick={submitAudit}
                 className={cn("w-full py-5 rounded-[24px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all",
                   darkMode ? "bg-blue-600 text-white shadow-blue-500/20" : "bg-zinc-900 text-white shadow-zinc-900/20")}>
                  Finalize Audit <ArrowRight size={18} />
               </button>
            </div>
         )}
      </div>
    </div>
  );
}
