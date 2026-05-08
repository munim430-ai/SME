import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Plus, 
  BarChart3, 
  Egg, 
  Activity, 
  Weight, 
  Skull,
  Calendar,
  X,
  PlusCircle,
  Archive,
  ArrowRight
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import { UserProfile, Language, ProductionLog } from '../../types';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

export default function ProductionLogView({ setView, lang, profile, darkMode }: { setView: (v: any) => void, lang: Language, profile: UserProfile | null, darkMode?: boolean }) {
  const [logs, setLogs] = useState<ProductionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newLog, setNewLog] = useState<Partial<ProductionLog>>({
    type: 'EGGS',
    value: 0,
    unit: 'Units',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchLogs();
  }, [profile]);

  const fetchLogs = async () => {
    const uid = auth.currentUser?.uid || profile?.uid;
    if (!uid || uid === 'guest-preview') {
      setLoading(false);
      return;
    }
    try {
      const q = query(
        collection(db, 'production_logs'),
        where('ownerId', '==', uid),
        orderBy('date', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductionLog)));
    } catch (error) {
      console.error("Fetch logs error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const uid = auth.currentUser?.uid || profile?.uid;
    if (!uid) return;
    try {
      await addDoc(collection(db, 'production_logs'), {
        ...newLog,
        ownerId: uid,
        updatedAt: new Date().toISOString()
      });
      setShowModal(false);
      setNewLog({ type: 'EGGS', value: 0, unit: 'Units', date: new Date().toISOString().split('T')[0] });
      fetchLogs();
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, 'production_logs');
    }
  };

  const icons = {
    EGGS: <Egg />,
    FEED_CONSUMED: <Activity />,
    WEIGHT: <Weight />,
    MORTALITY: <Skull />,
    OTHER: <PlusCircle />
  };

  return (
    <div className={cn("h-full flex flex-col transition-colors duration-300", 
      darkMode ? "bg-zinc-950 text-white" : "bg-[#F5F5F7] text-zinc-900")}>
      <div className={cn("p-6 pt-12 flex items-center justify-between sticky top-0 z-10 border-b transition-colors",
        darkMode ? "bg-zinc-900 border-white/5" : "bg-white border-gray-100")}>
         <div className="flex items-center gap-4">
            <button onClick={() => setView('services')} className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              darkMode ? "bg-white/5 text-zinc-400" : "bg-gray-50 text-gray-500")}>
               <ChevronLeft size={24} />
            </button>
            <h2 className={cn("text-xl font-black italic tracking-tight transition-colors",
              darkMode ? "text-white" : "text-zinc-950")}>Production Log</h2>
         </div>
         <button onClick={() => setShowModal(true)} className={cn("w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95",
           darkMode ? "bg-blue-600 text-white shadow-blue-500/10" : "bg-zinc-900 text-white shadow-zinc-200")}>
            <Plus size={24} />
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
         {logs.length === 0 && !loading && (
           <div className={cn("p-12 text-center transition-opacity", darkMode ? "opacity-20" : "opacity-30")}>
              <Archive size={64} className="mx-auto mb-4" />
              <p className="font-bold italic">No logs found. Start tracking your daily production.</p>
           </div>
         )}

         <div className="space-y-4">
            {logs.map(log => (
              <div key={log.id} className={cn("p-5 rounded-3xl border shadow-sm flex items-center justify-between transition-colors",
                darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-50")}>
                 <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                      log.type === 'MORTALITY' 
                        ? (darkMode ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-500") 
                        : (darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600")
                    )}>
                       {icons[log.type] || <BarChart3 />}
                    </div>
                    <div>
                       <p className={cn("text-[10px] font-black uppercase tracking-widest transition-colors",
                         darkMode ? "text-zinc-500" : "text-gray-400")}>{log.type.replace('_', ' ')}</p>
                       <p className={cn("font-bold transition-colors",
                         darkMode ? "text-zinc-200" : "text-gray-900")}>{format(new Date(log.date), 'MMM dd, yyyy')}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className={cn("text-xl font-black transition-colors",
                      darkMode ? "text-white" : "text-zinc-900")}>
                      {log.value} <span className={cn("text-xs font-normal transition-colors",
                        darkMode ? "text-zinc-500" : "text-gray-400")}>{log.unit}</span>
                    </p>
                 </div>
              </div>
            ))}
         </div>
      </div>

      <AnimatePresence>
         {showModal && (
           <div className="fixed inset-0 z-50 flex items-end justify-center">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className={cn("w-full max-w-md rounded-t-[40px] p-8 z-10 transition-colors",
                darkMode ? "bg-zinc-900 shadow-none border-t border-white/5" : "bg-white")}>
                 <div className="flex items-center justify-between mb-8">
                    <h3 className={cn("text-2xl font-black italic tracking-tight underline decoration-blue-500 underline-offset-8 transition-colors",
                      darkMode ? "text-white" : "text-zinc-900")}>New Log Entry</h3>
                    <button onClick={() => setShowModal(false)} className={cn("p-2 rounded-full transition-colors",
                      darkMode ? "bg-white/5 text-zinc-400" : "bg-gray-100 text-gray-500")}><X size={20} /></button>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-2">
                       <p className={cn("text-xs font-black uppercase tracking-widest transition-colors",
                         darkMode ? "text-zinc-500" : "text-gray-400")}>Type of Record</p>
                       <div className="grid grid-cols-3 gap-2">
                          {['EGGS', 'FEED_CONSUMED', 'WEIGHT', 'MORTALITY', 'OTHER'].map(type => (
                             <button 
                               key={type}
                               onClick={() => setNewLog({...newLog, type: type as any, unit: type === 'EGGS' ? 'Units' : type === 'MORTALITY' ? 'Birds' : 'Kg'})}
                               className={cn(
                                 "py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all",
                                 newLog.type === type 
                                   ? (darkMode ? "bg-blue-600 text-white border-blue-600" : "bg-zinc-900 text-white border-zinc-900") 
                                   : (darkMode ? "bg-white/5 text-zinc-500 border-white/5" : "bg-white text-gray-400 border-gray-100")
                               )}
                             >
                                {type.replace('_', ' ')}
                             </button>
                          ))}
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <p className={cn("text-xs font-black uppercase tracking-widest transition-colors",
                            darkMode ? "text-zinc-500" : "text-gray-400")}>Entry Value</p>
                          <input 
                            type="number"
                            className={cn("w-full text-2xl font-black border-b-2 outline-none pb-2 bg-transparent transition-all",
                              darkMode ? "border-white/10 text-white focus:border-blue-500" : "border-gray-100 text-zinc-900 focus:border-blue-500")}
                            value={newLog.value}
                            onChange={e => setNewLog({...newLog, value: Number(e.target.value)})}
                          />
                       </div>
                       <div className="space-y-2">
                          <p className={cn("text-xs font-black uppercase tracking-widest transition-colors",
                            darkMode ? "text-zinc-500" : "text-gray-400")}>Unit</p>
                          <input 
                            className={cn("w-full text-2xl font-black border-b-2 outline-none pb-2 bg-transparent transition-all",
                              darkMode ? "border-white/10 text-white focus:border-blue-500" : "border-gray-100 text-zinc-900 focus:border-blue-500")}
                            value={newLog.unit}
                            onChange={e => setNewLog({...newLog, unit: e.target.value})}
                          />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <p className={cn("text-xs font-black uppercase tracking-widest text-center mb-1 transition-colors",
                         darkMode ? "text-zinc-500" : "text-gray-400")}>Entry Date</p>
                       <input 
                         type="date"
                         className={cn("w-full text-center py-3 rounded-2xl font-bold outline-none transition-colors",
                           darkMode ? "bg-white/5 text-white" : "bg-gray-50 text-zinc-900")}
                         value={newLog.date}
                         onChange={e => setNewLog({...newLog, date: e.target.value})}
                       />
                    </div>

                    <button onClick={handleAdd} className={cn("w-full py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2",
                      darkMode ? "bg-blue-600 text-white" : "bg-zinc-900 text-white")}>
                       Save Record <ArrowRight size={18} />
                    </button>
                 </div>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
}
