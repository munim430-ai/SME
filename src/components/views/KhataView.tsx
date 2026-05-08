import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { TRANSLATIONS } from '../../constants';
import { UserProfile, Language, Ledger } from '../../types';
import { Search, Plus, MessageSquare, ChevronLeft, ArrowUpRight, ArrowDownRight, UserPlus, X, ImageIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import PhotoUpload from '../PhotoUpload';

export default function KhataView({ setView, lang, profile, darkMode }: { setView: (v: any) => void, lang: Language, profile: UserProfile | null, darkMode?: boolean }) {
  const t = TRANSLATIONS[lang];
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState<Ledger | null>(null);
  const [newBuyer, setNewBuyer] = useState({ name: '', phone: '', due: 0, photo: '' });
  const [newBaki, setNewBaki] = useState({ amount: 0, description: '', type: 'BAKI' as 'BAKI' | 'PAYMENT', attachment: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLedgers();
  }, []);

  const fetchLedgers = async () => {
    const uid = auth.currentUser?.uid || profile?.uid;
    if (!uid || uid === 'guest-preview') return;
    try {
      setLoading(true);
      const q = query(collection(db, 'ledgers'), where('ownerId', '==', uid));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ledger));
      setLedgers(data);
      if (selectedLedger) {
        const updated = data.find(l => l.id === selectedLedger.id);
        if (updated) setSelectedLedger(updated);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'ledgers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBuyer = async () => {
    const uid = auth.currentUser?.uid || profile?.uid;
    if (!uid) return;
    if (!newBuyer.name) {
      alert("Name is required");
      return;
    }
    try {
      setLoading(true);
      await addDoc(collection(db, 'ledgers'), {
        ownerId: uid,
        buyerName: newBuyer.name,
        buyerPhone: newBuyer.phone,
        totalDue: Number(newBuyer.due),
        totalPaid: 0,
        attachments: newBuyer.photo ? [newBuyer.photo] : [],
        updatedAt: new Date().toISOString(),
        history: newBuyer.due > 0 ? [{
          amount: Number(newBuyer.due),
          description: 'Initial Balance',
          timestamp: new Date().toISOString(),
          type: 'BAKI',
          attachment: newBuyer.photo || null
        }] : []
      });
      setNewBuyer({ name: '', phone: '', due: 0, photo: '' });
      setShowAdd(false);
      fetchLedgers();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'ledgers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBakiLog = async () => {
    if (!selectedLedger) return;
    if (newBaki.amount <= 0) {
      alert("Amount must be greater than zero");
      return;
    }

    try {
      setLoading(true);
      const updatedDue = newBaki.type === 'BAKI' 
        ? selectedLedger.totalDue + newBaki.amount 
        : selectedLedger.totalDue - newBaki.amount;
      
      const updatedPaid = newBaki.type === 'PAYMENT' 
        ? selectedLedger.totalPaid + newBaki.amount 
        : selectedLedger.totalPaid;

      const log = {
        amount: Number(newBaki.amount),
        description: newBaki.description || (newBaki.type === 'BAKI' ? 'Added Baki' : 'Payment Received'),
        timestamp: new Date().toISOString(),
        type: newBaki.type,
        attachment: newBaki.attachment || null
      };

      const history = selectedLedger.history || [];

      await updateDoc(doc(db, 'ledgers', selectedLedger.id), {
        totalDue: updatedDue,
        totalPaid: updatedPaid,
        updatedAt: new Date().toISOString(),
        lastPaymentDate: newBaki.type === 'PAYMENT' ? new Date().toISOString() : selectedLedger.lastPaymentDate,
        history: [...history, log],
        attachments: newBaki.attachment ? [...(selectedLedger.attachments || []), newBaki.attachment] : (selectedLedger.attachments || [])
      });

      // Also create a global transaction record
      await addDoc(collection(db, 'transactions'), {
        userId: auth.currentUser?.uid || profile?.uid,
        amount: Number(newBaki.amount),
        type: newBaki.type === 'BAKI' ? 'SALE' : 'SALE', 
        category: 'Wholesale',
        description: `${newBaki.type === 'BAKI' ? 'Baki Sale' : 'Payment'} - ${selectedLedger.buyerName}`,
        timestamp: new Date().toISOString(),
        isBaki: newBaki.type === 'BAKI',
        attachments: newBaki.attachment ? [newBaki.attachment] : [],
        metadata: {
          ledgerId: selectedLedger.id,
          buyerName: selectedLedger.buyerName
        }
      });

      setNewBaki({ amount: 0, description: '', type: 'BAKI', attachment: '' });
      fetchLedgers();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `ledgers/${selectedLedger.id}`);
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = async (ledger: Ledger) => {
     try {
       await fetch('/api/remind', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           phoneNumber: ledger.buyerPhone,
           amount: ledger.totalDue,
           buyerName: ledger.buyerName
         })
       });
       alert(`Reminder sent to ${ledger.buyerName}`);
     } catch (e) {
       console.error(e);
     }
  };

  const totalPabo = ledgers.reduce((acc, curr) => acc + curr.totalDue, 0);
  const totalDiyeche = ledgers.reduce((acc, curr) => acc + curr.totalPaid, 0);

  return (
    <div className={cn("flex flex-col h-full transition-colors duration-300", darkMode ? "bg-zinc-950 text-white" : "bg-[#F5F5F7] text-[#1D1D1F]")}>
      <div className={cn("p-6 flex items-center justify-between sticky top-0 z-10 pt-12 border-b shadow-sm transition-colors duration-300", 
        darkMode ? "bg-zinc-900/80 border-white/5 backdrop-blur-xl" : "bg-white/80 border-gray-100 backdrop-blur-xl")}>
         <button onClick={() => setView('dashboard')} className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", 
           darkMode ? "bg-white/5 text-zinc-400" : "bg-gray-50 text-gray-500")}>
           <ChevronLeft size={24} />
         </button>
         <h2 className="text-xl font-black tracking-tight italic">Digital Khata</h2>
         <button onClick={() => setShowAdd(true)} className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-600 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">
           <Plus size={24} />
         </button>
      </div>

      <div className="p-6 grid grid-cols-2 gap-4">
         <div className={cn("p-5 rounded-[32px] border transition-colors", darkMode ? "bg-red-950/20 border-red-500/20" : "bg-red-50 border-red-100")}>
            <p className="text-[10px] uppercase font-bold tracking-widest text-red-500 mb-1">{t.totalDue}</p>
            <p className="text-2xl font-black text-red-600">Tk {totalPabo.toLocaleString()}</p>
            <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-red-400">
               <ArrowUpRight size={12} /> +12% from last wk
            </div>
         </div>
         <div className={cn("p-5 rounded-[32px] border transition-colors", darkMode ? "bg-green-950/20 border-green-500/20" : "bg-green-50 border-green-100")}>
            <p className="text-[10px] uppercase font-bold tracking-widest text-green-500 mb-1">{t.totalPaid}</p>
            <p className="text-2xl font-black text-green-600">Tk {totalDiyeche.toLocaleString()}</p>
            <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-green-400">
               <ArrowDownRight size={12} /> Steady progress
            </div>
         </div>
      </div>

      <div className="flex-1 px-4 overflow-y-auto pb-32 space-y-3">
         <div className="relative px-2 py-4">
            <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
               className={cn("w-full rounded-full py-3 pl-12 pr-4 text-sm font-medium border shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-colors", 
                 darkMode ? "bg-white/5 border-white/5 text-white" : "bg-white border-gray-100 text-[#1D1D1F]")}
               placeholder="Search buyers..."
            />
         </div>

          {ledgers.map((ledger) => (
            <div key={ledger.id} className="relative group overflow-hidden">
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedLedger(ledger)}
                className={cn("p-5 rounded-3xl border flex items-center justify-between relative z-10 shadow-sm transition-all",
                  darkMode ? "bg-zinc-900 border-white/5 active:bg-zinc-800" : "bg-white border-gray-50 active:bg-gray-50")}
              >
                 <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-colors uppercase",
                      darkMode ? "bg-white/5 text-zinc-500" : "bg-gray-100 text-gray-400")}>
                       {ledger.buyerName[0]}
                    </div>
                    <div>
                       <p className={cn("font-bold transition-colors text-sm", darkMode ? "text-white" : "text-gray-900")}>{ledger.buyerName}</p>
                       <p className={cn("text-[10px] uppercase font-black tracking-widest opacity-40 transition-colors shrink-0", 
                         darkMode ? "text-zinc-500" : "text-gray-400")}>
                         {ledger.buyerPhone || 'No Phone'}
                       </p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-lg font-black text-red-600">Tk {ledger.totalDue.toLocaleString()}</p>
                    <p className={cn("text-[8px] font-black uppercase tracking-widest transition-colors", darkMode ? "text-zinc-600" : "text-gray-300")}>Pending</p>
                 </div>
              </motion.div>
           </div>
          ))}

         {ledgers.length === 0 && (
           <div className={cn("text-center py-20 opacity-30", darkMode ? "text-white" : "text-zinc-900")}>
              <UserPlus size={48} className="mx-auto mb-4" />
              <p className="font-black italic tracking-tight text-xl">Empty Ledger</p>
              <p className="text-xs font-medium mt-1">Start adding buyers to track Baki.</p>
           </div>
         )}
      </div>

       <AnimatePresence>
         {selectedLedger && (
           <div className="fixed inset-0 z-[60] flex items-end justify-center">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setSelectedLedger(null)}
               className="absolute inset-0 bg-black/80 backdrop-blur-md"
             />
             <motion.div 
               initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
               className={cn("w-full max-w-md rounded-t-[50px] p-8 z-10 shadow-2xl flex flex-col max-h-[90vh]", 
                 darkMode ? "bg-zinc-950" : "bg-white")}
             >
               <div className="flex items-center justify-between mb-8 px-2 pt-4">
                 <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-black">
                      {selectedLedger.buyerName[0]}
                    </div>
                    <div>
                       <h3 className={cn("text-2xl font-black tracking-tighter", darkMode ? "text-white" : "text-zinc-900")}>
                         {selectedLedger.buyerName}
                       </h3>
                       <p className="text-xs opacity-40 font-bold">{selectedLedger.buyerPhone}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedLedger(null)} className={cn("p-2 rounded-full", darkMode ? "bg-white/5" : "bg-gray-100")}>
                   <X size={20} />
                 </button>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className={cn("p-5 rounded-3xl border", darkMode ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-100")}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Total Due</p>
                    <p className="text-2xl font-black text-red-600">Tk {selectedLedger.totalDue.toLocaleString()}</p>
                  </div>
                  <div className={cn("p-5 rounded-3xl border", darkMode ? "bg-green-500/10 border-green-500/20" : "bg-green-50 border-green-100")}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-1">Total Paid</p>
                    <p className="text-2xl font-black text-green-600">Tk {selectedLedger.totalPaid.toLocaleString()}</p>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto space-y-6 px-2 pb-8 scrollbar-none">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Add New Entry</p>
                    <div className="grid grid-cols-2 gap-3">
                       <button 
                         onClick={() => setNewBaki({...newBaki, type: 'BAKI'})}
                         className={cn("py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all",
                           newBaki.type === 'BAKI' ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-500/20" : (darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-100"))}
                       >
                         Add Baki
                       </button>
                       <button 
                         onClick={() => setNewBaki({...newBaki, type: 'PAYMENT'})}
                         className={cn("py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all",
                           newBaki.type === 'PAYMENT' ? "bg-green-600 text-white border-green-600 shadow-lg shadow-green-500/20" : (darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-100"))}
                       >
                         Receive Pay
                       </button>
                    </div>

                    <div className="space-y-4 pt-2">
                       <input 
                         type="number"
                         placeholder="Amount (Tk)"
                         className={cn("w-full py-4 px-6 rounded-2xl border font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all",
                           darkMode ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-100")}
                         value={newBaki.amount || ''}
                         onChange={(e) => setNewBaki({...newBaki, amount: Number(e.target.value)})}
                       />
                       <input 
                         type="text"
                         placeholder="Description (Optional)"
                         className={cn("w-full py-4 px-6 rounded-2xl border font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all",
                           darkMode ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-100")}
                         value={newBaki.description}
                         onChange={(e) => setNewBaki({...newBaki, description: e.target.value})}
                       />
                       <div className="flex items-center gap-3">
                          <PhotoUpload 
                            darkMode={darkMode} 
                            onUpload={(url) => setNewBaki({...newBaki, attachment: url})}
                            label="Proof (Photo)"
                          />
                          {newBaki.attachment && <p className="text-[10px] font-bold text-green-500 flex items-center gap-1"><ImageIcon size={12}/> Added</p>}
                       </div>
                       <button 
                         onClick={handleAddBakiLog}
                         disabled={loading}
                         className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                       >
                         {loading ? "Processing..." : "Confirm Entry"}
                       </button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Entry History</p>
                       <button 
                         onClick={() => sendReminder(selectedLedger)}
                         className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-widest bg-blue-600/10 px-4 py-2 rounded-full active:scale-95 transition-transform"
                       >
                         <MessageSquare size={14} /> Send Reminder
                       </button>
                    </div>
                    
                    <div className="space-y-3 pb-10">
                       {(selectedLedger.history || []).slice().reverse().map((log, i) => (
                         <div key={i} className={cn("p-4 rounded-2xl border flex justify-between items-center", 
                           darkMode ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100")}>
                           <div className="flex items-center gap-3">
                             <div className="flex-1">
                               <p className="font-bold text-sm">{log.description}</p>
                               <p className="text-[10px] opacity-40 uppercase font-black">{new Date(log.timestamp).toLocaleDateString()}</p>
                             </div>
                             {log.attachment && (
                               <a href={log.attachment} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                                 <img src={log.attachment} className="w-full h-full object-cover" alt="Proof" />
                               </a>
                             )}
                           </div>
                           <p className={cn("font-black tracking-tighter italic text-lg", log.type === 'BAKI' ? "text-red-500" : "text-green-500")}>
                             {log.type === 'BAKI' ? '+' : '-'} Tk {log.amount.toLocaleString()}
                           </p>
                         </div>
                       ))}
                       {(!selectedLedger.history || selectedLedger.history.length === 0) && (
                         <p className="text-center py-8 text-xs italic opacity-30 font-bold">No history available</p>
                       )}
                    </div>
                  </div>
               </div>
             </motion.div>
           </div>
         )}

         {showAdd && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowAdd(false)}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
               className={cn("w-full max-w-md rounded-t-[40px] p-10 z-10 shadow-2xl relative", darkMode ? "bg-zinc-900" : "bg-white")}
             >
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-2xl font-black tracking-tight italic">New Buyer Entry</h3>
                   <button onClick={() => setShowAdd(false)} className={cn("p-2 rounded-full", darkMode ? "bg-white/5" : "bg-gray-100")}><X size={20} /></button>
                </div>
                <div className="space-y-6">
                   <div className="space-y-2">
                      <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", darkMode ? "text-zinc-500" : "text-gray-400")}>Buyer Name</p>
                      <input className={cn("w-full text-xl font-bold border-b-2 outline-none pb-2 bg-transparent transition-colors", 
                        darkMode ? "border-white/10 focus:border-blue-500 text-white" : "border-gray-100 focus:border-blue-500 text-[#1D1D1F]")} 
                             value={newBuyer.name} onChange={e => setNewBuyer({...newBuyer, name: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", darkMode ? "text-zinc-500" : "text-gray-400")}>Phone Number</p>
                      <input className={cn("w-full text-xl font-bold border-b-2 outline-none pb-2 bg-transparent transition-colors", 
                        darkMode ? "border-white/10 focus:border-blue-500 text-white" : "border-gray-100 focus:border-blue-500 text-[#1D1D1F]")} 
                             value={newBuyer.phone} onChange={e => setNewBuyer({...newBuyer, phone: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", darkMode ? "text-zinc-500" : "text-gray-400")}>Initial Baki (Tk)</p>
                      <input type="number" className={cn("w-full text-xl font-bold border-b-2 outline-none pb-2 bg-transparent transition-colors", 
                        darkMode ? "border-white/10 focus:border-blue-500 text-white" : "border-gray-100 focus:border-blue-500 text-[#1D1D1F]")} 
                             value={newBuyer.due || ''} onChange={e => setNewBuyer({...newBuyer, due: Number(e.target.value)})} />
                   </div>
                   <div className="space-y-3">
                      <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", darkMode ? "text-zinc-500" : "text-gray-400")}>Buyer Photo / ID</p>
                      <PhotoUpload 
                        darkMode={darkMode} 
                        onUpload={(url) => setNewBuyer({...newBuyer, photo: url})} 
                        label="Upload Photo"
                      />
                   </div>
                   <button 
                     onClick={handleAddBuyer}
                     className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 active:scale-95 transition-all mt-8"
                   >
                      Add to Database
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
