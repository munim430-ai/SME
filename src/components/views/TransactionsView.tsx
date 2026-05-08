import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, query, where, getDocs, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Transaction, Language, UserProfile } from '../../types';
import { TRANSLATIONS } from '../../constants';
import { 
  ChevronLeft, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Tag, 
  MoreHorizontal,
  X,
  FileText,
  ShoppingBag,
  Download,
  SortAsc,
  SortDesc,
  CheckCircle,
  AlertCircle,
  SmartphoneNfc,
  TrendingUp,
  Filter,
  PieChart as PieChartIcon,
  ImageIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';
import PhotoUpload from '../PhotoUpload';
import { format, isAfter, isBefore, startOfDay, endOfDay, subDays, startOfWeek, startOfMonth, eachDayOfInterval, subMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import Skeleton from '../ui/Skeleton';

interface Props {
  setView: (view: any) => void;
  lang: Language;
  profile: UserProfile | null;
  darkMode?: boolean;
}

export default function TransactionsView({ setView, lang, profile, darkMode }: Props) {
  const t = TRANSLATIONS[lang];
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'SALE' | 'EXPENSE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'BAKI'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ 
    description: '', 
    amount: 0, 
    category: '', 
    isBaki: false, 
    timestamp: '',
    dueDate: '',
    recurrence: 'NONE' as 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
  });
  const [updating, setUpdating] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const CATEGORIES = {
    SALE: ['Broiler', 'Layer', 'Eggs', 'Manure', 'Chicks', 'Wholesale', 'Retail', 'Other'],
    EXPENSE: ['Feed', 'Medicine', 'Veterinary', 'Equipment', 'Utilities', 'Labor', 'Rent', 'Transport', 'Marketing', 'Warehouse', 'Other']
  };

  const fetchTx = async () => {
    const uid = auth.currentUser?.uid || profile?.uid;
    if (!uid || uid === 'guest-preview') {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', uid),
        orderBy('timestamp', 'desc')
      );
      const snap = await getDocs(q);
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTx();
  }, []);

  const handleTogglePaid = async (tx: Transaction) => {
    const uid = auth.currentUser?.uid || profile?.uid;
    if (!uid) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'transactions', tx.id), {
        isBaki: !tx.isBaki,
        updatedAt: new Date().toISOString()
      });
      setSelectedTx({ ...tx, isBaki: !tx.isBaki });
      fetchTx();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `transactions/${tx.id}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleEditTx = async () => {
    const uid = auth.currentUser?.uid || profile?.uid;
    if (!selectedTx || !uid) return;
    
    // Validation
    if (!editForm.description.trim()) {
      alert("Please provide a description");
      return;
    }
    if (editForm.amount <= 0) {
      alert("Amount must be greater than zero");
      return;
    }

    setUpdating(true);
    try {
      await updateDoc(doc(db, 'transactions', selectedTx.id), {
        description: editForm.description,
        amount: Number(editForm.amount),
        category: editForm.category,
        isBaki: editForm.isBaki,
        timestamp: new Date(editForm.timestamp).toISOString(),
        dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : null,
        recurrence: editForm.recurrence,
        updatedAt: new Date().toISOString()
      });
      setSelectedTx({ 
        ...selectedTx, 
        description: editForm.description,
        amount: Number(editForm.amount),
        category: editForm.category,
        isBaki: editForm.isBaki,
        timestamp: new Date(editForm.timestamp).toISOString(),
        dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : undefined,
        recurrence: editForm.recurrence
      });
      setIsEditing(false);
      fetchTx();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `transactions/${selectedTx.id}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTx = async () => {
    const uid = auth.currentUser?.uid || profile?.uid;
    if (!selectedTx || !uid) return;
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    setUpdating(true);
    try {
      await deleteDoc(doc(db, 'transactions', selectedTx.id));
      setSelectedTx(null);
      fetchTx();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `transactions/${selectedTx.id}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTxIds.size === 0) return;
    if (!confirm(`Delete ${selectedTxIds.size} transactions?`)) return;
    setUpdating(true);
    try {
      const promises = Array.from(selectedTxIds).map((id: string) => deleteDoc(doc(db, 'transactions', id)));
      await Promise.all(promises);
      setSelectedTxIds(new Set());
      setIsSelectionMode(false);
      fetchTx();
    } catch (e) {
      alert("Error in bulk delete");
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkTogglePaid = async (toPaid: boolean) => {
    if (selectedTxIds.size === 0) return;
    setUpdating(true);
    try {
      const promises = Array.from(selectedTxIds).map((id: string) => 
        updateDoc(doc(db, 'transactions', id), { 
          isBaki: !toPaid,
          updatedAt: new Date().toISOString()
        })
      );
      await Promise.all(promises);
      setSelectedTxIds(new Set());
      setIsSelectionMode(false);
      fetchTx();
    } catch (e) {
      alert("Error in bulk update");
    } finally {
      setUpdating(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedTxIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedTxIds(newSet);
  };

   const handleAddPhoto = async (url: string) => {
    if (!selectedTx) return;
    setUpdating(true);
    try {
      const updatedAttachments = [...(selectedTx.attachments || []), url];
      await updateDoc(doc(db, 'transactions', selectedTx.id), {
        attachments: updatedAttachments,
        updatedAt: new Date().toISOString()
      });
      setSelectedTx({ ...selectedTx, attachments: updatedAttachments });
      fetchTx();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `transactions/${selectedTx.id}`);
    } finally {
      setUpdating(false);
    }
  };

  const startEditing = (tx: Transaction) => {
    setEditForm({
      description: tx.description || '',
      amount: tx.amount,
      category: tx.category || '',
      isBaki: tx.isBaki,
      timestamp: format(new Date(tx.timestamp), 'yyyy-MM-dd\'T\'HH:mm'),
      dueDate: tx.dueDate ? format(new Date(tx.dueDate), 'yyyy-MM-dd') : '',
      recurrence: tx.recurrence || 'NONE'
    });
    setIsEditing(true);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Status', 'Vendor'];
    const rows = filtered.map(tx => [
      format(new Date(tx.timestamp), 'yyyy-MM-dd HH:mm'),
      `"${(tx.description || '').replace(/"/g, '""')}"`,
      tx.category || 'N/A',
      tx.type,
      tx.amount,
      tx.isBaki ? 'Unpaid' : 'Paid',
      `"${(tx.metadata?.vendor || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `keystone_records_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSearch('');
    setFilter('ALL');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setStartDate('');
    setEndDate('');
    setSortBy('date-desc');
  };

  const setQuickRange = (range: 'today' | 'week' | 'month' | 'clear') => {
    const now = new Date();
    if (range === 'clear') {
      setStartDate('');
      setEndDate('');
      return;
    }
    
    setEndDate(format(now, 'yyyy-MM-dd'));
    if (range === 'today') setStartDate(format(now, 'yyyy-MM-dd'));
    if (range === 'week') setStartDate(format(startOfWeek(now), 'yyyy-MM-dd'));
    if (range === 'month') setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
  };

  const isFiltered = search || filter !== 'ALL' || statusFilter !== 'ALL' || categoryFilter !== 'ALL' || startDate || endDate;

  const filtered = transactions
    .filter(tx => {
      const matchesSearch = tx.description?.toLowerCase().includes(search.toLowerCase()) || 
                           tx.amount.toString().includes(search) ||
                           tx.category?.toLowerCase().includes(search.toLowerCase()) ||
                           tx.metadata?.vendor?.toLowerCase().includes(search.toLowerCase()) ||
                           tx.metadata?.items?.some((item: any) => item.name?.toLowerCase().includes(search.toLowerCase()));
      const matchesFilter = filter === 'ALL' || tx.type === filter;
      const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'BAKI' ? tx.isBaki : !tx.isBaki);
      const matchesCategory = categoryFilter === 'ALL' || tx.category === categoryFilter;
      
      let matchesDate = true;
      if (startDate) {
        matchesDate = matchesDate && isAfter(new Date(tx.timestamp), startOfDay(new Date(startDate)));
      }
      if (endDate) {
        matchesDate = matchesDate && isBefore(new Date(tx.timestamp), endOfDay(new Date(endDate)));
      }
      
      return matchesSearch && matchesFilter && matchesStatus && matchesCategory && matchesDate;
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortBy === 'date-asc') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

  const grouped = filtered.reduce((groups, tx) => {
    const date = format(new Date(tx.timestamp), 'yyyy-MM-dd');
    if (!groups[date]) groups[date] = [];
    groups[date].push(tx);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const totals = filtered.reduce((acc, tx) => {
    if (tx.type === 'SALE') acc.sales += tx.amount;
    else acc.expenses += tx.amount;
    return acc;
  }, { sales: 0, expenses: 0 });

  const chartData = [
    { name: 'Income', amount: totals.sales, color: '#10B981' },
    { name: 'Expense', amount: totals.expenses, color: '#EF4444' }
  ];

  return (
    <div className={cn("flex flex-col h-full transition-colors duration-300", darkMode ? "bg-zinc-950 text-white" : "bg-[#F5F5F7] text-[#1D1D1F]")}>
      {/* Header */}
      <div className={cn("p-6 flex items-center justify-between sticky top-0 z-20 pt-12 border-b shadow-sm transition-colors duration-300", 
        darkMode ? "bg-zinc-900/80 border-white/5 backdrop-blur-xl" : "bg-white/80 border-gray-100 backdrop-blur-xl")}>
        <button onClick={() => setView('dashboard')} className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", 
          darkMode ? "bg-white/5 text-zinc-400" : "bg-gray-50 text-gray-500")}>
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-black italic tracking-tight underline decoration-blue-600 decoration-4 underline-offset-4">Records</h2>
        <button 
          onClick={exportToCSV}
          className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", 
            darkMode ? "bg-white/5 text-zinc-400" : "bg-white text-gray-500 border border-gray-100")}
        >
          <Download size={20} />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary & Chart Card */}
        <div className={cn("rounded-[40px] p-8 shadow-2xl transition-all relative overflow-hidden", 
          darkMode ? "bg-zinc-900 border border-white/5" : "bg-white border border-gray-100")}>
           <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 space-y-6 w-full">
                 <div>
                    <p className={cn("text-[10px] font-black uppercase tracking-[0.3em] mb-2", darkMode ? "text-zinc-500" : "text-gray-400")}>Filtered Overview</p>
                    <h3 className="text-4xl font-black italic tracking-tighter">
                       {filtered.length} <span className="text-blue-600">Transactions</span>
                    </h3>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className={cn("p-4 rounded-3xl", darkMode ? "bg-white/5" : "bg-gray-50")}>
                       <p className="text-[8px] font-black uppercase text-green-500 tracking-widest mb-1">Total Sales</p>
                       <p className="text-lg font-black italic">Tk {totals.sales.toLocaleString()}</p>
                    </div>
                    <div className={cn("p-4 rounded-3xl", darkMode ? "bg-white/5" : "bg-gray-50")}>
                       <p className="text-[8px] font-black uppercase text-red-400 tracking-widest mb-1">Total Expenses</p>
                       <p className="text-lg font-black italic">Tk {totals.expenses.toLocaleString()}</p>
                    </div>
                 </div>
              </div>

              <div className="w-full md:w-48 h-48 flex items-center justify-center shrink-0">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                       <XAxis dataKey="name" hide />
                       <Tooltip cursor={{fill: 'transparent'}} content={() => null} />
                       <Bar dataKey="amount" radius={[12, 12, 12, 12]} barSize={40}>
                          {chartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* Search, Sort & CSV */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em]", darkMode ? "text-zinc-500" : "text-gray-400")}>
              {isSelectionMode ? `${selectedTxIds.size} Selected` : 'Filter Records'}
            </h3>
            <div className="flex gap-2">
              {isFiltered && !isSelectionMode && (
                <button 
                  onClick={clearFilters}
                  className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 bg-blue-600/10 px-3 py-1.5 rounded-full"
                >
                  Clear
                </button>
              )}
              <button 
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  setSelectedTxIds(new Set());
                }}
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full transition-all border",
                  isSelectionMode 
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20" 
                    : (darkMode ? "bg-white/5 border-white/5 text-zinc-400" : "bg-gray-100 border-transparent text-gray-500")
                )}
              >
                {isSelectionMode ? 'Cancel' : 'Select'}
              </button>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="relative flex-1">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
               <input 
                 className={cn("w-full border rounded-3xl py-4 pl-14 pr-12 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all",
                   darkMode ? "bg-zinc-900 border-white/5 text-white" : "bg-white border-gray-100 text-[#1D1D1F]")}
                 placeholder="Search anything..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
               />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'Week' },
              { id: 'month', label: 'Month' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setQuickRange(r.id as any)}
                className={cn(
                  "px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                  startDate === format(r.id === 'week' ? startOfWeek(new Date()) : r.id === 'month' ? startOfMonth(new Date()) : new Date(), 'yyyy-MM-dd') &&
                  endDate === format(new Date(), 'yyyy-MM-dd')
                    ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20" 
                    : (darkMode ? "bg-white/5 text-zinc-500 border-white/5" : "bg-white text-gray-400 border-gray-100")
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className={cn("rounded-[32px] p-5 shadow-sm border transition-colors", darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-50")}>
                <p className={cn("text-[8px] font-black uppercase tracking-widest mb-1", darkMode ? "text-zinc-600" : "text-gray-400")}>Start</p>
                <input 
                  type="date"
                  className="w-full text-sm font-black bg-transparent outline-none"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
             </div>
             <div className={cn("rounded-[32px] p-5 shadow-sm border transition-colors", darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-50")}>
                <p className={cn("text-[8px] font-black uppercase tracking-widest mb-1", darkMode ? "text-zinc-600" : "text-gray-400")}>End</p>
                <input 
                  type="date"
                  className="w-full text-sm font-black bg-transparent outline-none"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
             </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none items-center">
             <div className={cn("flex gap-1 p-1 rounded-full border shadow-sm mr-2 shrink-0 transition-colors", 
               darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-100")}>
               <button 
                 onClick={() => setSortBy(sortBy.includes('desc') ? sortBy.replace('desc', 'asc') as any : sortBy.replace('asc', 'desc') as any)}
                 className="p-3 rounded-full bg-blue-600 text-white"
               >
                 {sortBy.includes('desc') ? <SortDesc size={16} /> : <SortAsc size={16} />}
               </button>
               <select 
                 className="bg-transparent text-[10px] font-black uppercase tracking-widest px-3 outline-none"
                 value={sortBy.replace('-asc', '').replace('-desc', '')}
                 onChange={(e) => setSortBy(`${e.target.value}-${sortBy.includes('desc') ? 'desc' : 'asc'}` as any)}
               >
                 <option value="date" className={darkMode ? "bg-zinc-900" : ""}>Date</option>
                 <option value="amount" className={darkMode ? "bg-zinc-900" : ""}>Amount</option>
               </select>
             </div>

             {['ALL', 'SALE', 'EXPENSE'].map((f) => (
               <button
                 key={f}
                 onClick={() => {
                   setFilter(f as any);
                   setCategoryFilter('ALL');
                 }}
                 className={cn(
                    "px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap shadow-sm",
                    filter === f 
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20" 
                      : (darkMode ? "bg-white/5 text-zinc-500 border-white/5" : "bg-white text-gray-400 border-gray-100")
                 )}
               >
                 {f === 'ALL' ? 'Everything' : f === 'SALE' ? 'Sales' : 'Expenses'}
               </button>
             ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none items-center">
             <span className="text-[8px] font-black uppercase text-gray-300 tracking-[0.2em] shrink-0 mr-2">Status:</span>
             {['ALL', 'PAID', 'BAKI'].map((s) => (
                <button
                   key={s}
                   onClick={() => setStatusFilter(s as any)}
                   className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap",
                      statusFilter === s ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-gray-400 border-gray-100"
                   )}
                >
                   {s}
                </button>
             ))}
          </div>

          {filter !== 'ALL' && (
             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none items-center">
                <span className="text-[8px] font-black uppercase text-gray-300 tracking-[0.2em] shrink-0 mr-2">Category:</span>
                <button
                   onClick={() => setCategoryFilter('ALL')}
                   className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap",
                      categoryFilter === 'ALL' ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-gray-400 border-gray-100"
                   )}
                >
                   All {filter === 'SALE' ? 'Sales' : 'Expenses'}
                </button>
                {CATEGORIES[filter as 'SALE' | 'EXPENSE'].map((c) => (
                   <button
                      key={c}
                      onClick={() => setCategoryFilter(c)}
                      className={cn(
                         "px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap",
                         categoryFilter === c ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-gray-400 border-gray-100"
                      )}
                   >
                      {c}
                   </button>
                ))}
             </div>
          )}
        </div>

        {/* List */}
        <div className="space-y-8 pb-32">
           {loading ? (
             <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={cn("p-5 rounded-[32px] flex items-center justify-between border transition-colors", 
                    darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-50")}>
                     <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-2xl" />
                        <div className="space-y-2">
                           <Skeleton className="w-32 h-4" />
                           <Skeleton className="w-20 h-2" />
                        </div>
                     </div>
                     <Skeleton className="w-24 h-6" />
                  </div>
                ))}
             </div>
           ) : Object.keys(grouped).length > 0 ? (
             Object.entries(grouped).map(([date, items]) => (
               <div key={date} className="space-y-4">
                 <div className="flex items-center gap-3 px-2">
                    <span className={cn("text-[10px] font-black uppercase tracking-[0.3em]", darkMode ? "text-zinc-700" : "text-gray-400")}>
                       {format(new Date(date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'Today' : 
                        format(new Date(date), 'yyyy-MM-dd') === format(new Date(Date.now() - 86400000), 'yyyy-MM-dd') ? 'Yesterday' :
                        format(new Date(date), 'MMMM d, yyyy')}
                    </span>
                    <div className={cn("h-[1px] flex-1 transition-colors", darkMode ? "bg-white/5" : "bg-gray-100")}></div>
                 </div>

                  {(items as Transaction[]).map(tx => (
                    <motion.div 
                      key={tx.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (isSelectionMode) {
                          toggleSelection(tx.id);
                        } else {
                          setSelectedTx(tx);
                        }
                      }}
                      className={cn(
                        "p-5 rounded-[32px] flex items-center justify-between border shadow-sm transition-all relative overflow-hidden",
                        selectedTxIds.has(tx.id) 
                          ? "border-blue-500 ring-4 ring-blue-500/10 bg-blue-600/5 shadow-blue-500/10" 
                          : (darkMode ? "bg-white/5 border-white/5 active:bg-white/10" : "bg-white border-gray-50 active:bg-gray-50")
                      )}
                    >
                       <div className="flex items-center gap-5">
                          {isSelectionMode && (
                            <div className={cn(
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                              selectedTxIds.has(tx.id) ? "bg-blue-600 border-blue-600 text-white" : (darkMode ? "border-white/10" : "border-gray-200")
                            )}>
                              {selectedTxIds.has(tx.id) && <CheckCircle size={14} />}
                            </div>
                          )}
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center relative transition-colors", 
                            tx.type === 'SALE' 
                              ? (darkMode ? "bg-green-500/20 text-green-500" : "bg-green-50 text-green-600") 
                              : (darkMode ? "bg-red-500/20 text-red-500" : "bg-red-50 text-red-600")
                          )}>
                             {tx.type === 'SALE' ? <TrendingUp size={24} /> : <TrendingUp size={24} className="rotate-180" />}
                             {tx.isBaki && (
                               <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                             )}
                          </div>
                          <div>
                             <div className="flex items-center gap-2">
                                <p className={cn("font-black tracking-tight line-clamp-1", darkMode ? "text-white" : "text-[#1D1D1F]")}>{tx.description || 'Transaction'}</p>
                                {tx.isBaki && <span className="text-[8px] font-black bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full uppercase tracking-tighter">Baki</span>}
                             </div>
                             <p className={cn("text-[10px] font-black mt-1 uppercase tracking-widest", darkMode ? "text-zinc-500" : "text-gray-400")}>
                                {tx.category || (tx.type === 'SALE' ? 'Income' : 'Expense')} • {format(new Date(tx.timestamp), 'h:mm a')}
                             </p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className={cn("text-lg font-black tracking-tighter", tx.type === 'SALE' ? "text-green-500" : (darkMode ? "text-white" : "text-[#1D1D1F]"))}>
                             {tx.type === 'SALE' ? (tx.isBaki ? '±' : '+') : '-'} Tk {tx.amount.toLocaleString()}
                          </p>
                          <p className={cn("text-[8px] font-black uppercase tracking-widest mt-1", darkMode ? "text-zinc-700" : "text-gray-300")}>Verified</p>
                       </div>
                    </motion.div>
                  ))}
               </div>
             ))
           ) : (
              <div className={cn("p-20 rounded-[50px] text-center border-2 border-dashed opacity-40 transition-colors", 
                darkMode ? "border-white/5" : "border-gray-200")}>
                 <Search className={cn("mx-auto mb-6", darkMode ? "text-white" : "text-gray-900")} size={64} />
                 <p className={cn("text-xl font-black italic tracking-tight", darkMode ? "text-white" : "text-zinc-900")}>Empty Records</p>
                 <p className="text-xs font-medium mt-2">Adjust your filters to see more results.</p>
              </div>
           )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {isSelectionMode && selectedTxIds.size > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className={cn("fixed bottom-12 left-6 right-6 z-40 rounded-[32px] p-5 flex items-center justify-between shadow-2xl border transition-all",
              darkMode ? "bg-zinc-900 border-white/10" : "bg-white border-gray-100")}
          >
            <div className="flex items-center gap-4 ml-4">
               <div className="bg-blue-600 w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black text-white shadow-xl shadow-blue-500/20">
                 {selectedTxIds.size}
               </div>
               <p className={cn("text-xs font-black uppercase tracking-widest", darkMode ? "text-white" : "text-zinc-900")}>Selected</p>
            </div>
            <div className="flex gap-3">
               <button 
                 onClick={() => handleBulkTogglePaid(true)}
                 className={cn("p-4 rounded-2xl transition-colors shadow-sm", 
                   darkMode ? "bg-white/5 text-green-500 hover:bg-white/10" : "bg-green-50 text-green-600 hover:bg-green-100")}
               >
                 <CheckCircle size={24} />
               </button>
               <button 
                 onClick={() => handleBulkDelete()}
                 className={cn("p-4 rounded-2xl transition-colors shadow-sm", 
                   darkMode ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "bg-red-50 text-red-600 hover:bg-red-100")}
               >
                 <X size={24} />
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => { setSelectedTx(null); setIsEditing(false); }}
               className="absolute inset-0 bg-black/80 backdrop-blur-md"
             />
             <motion.div 
               initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
               className={cn("w-full max-w-md rounded-t-[50px] p-10 z-10 shadow-2xl overflow-y-auto max-h-[90vh] relative", 
                 darkMode ? "bg-zinc-900" : "bg-white")}
             >
                <div className="flex items-center justify-between mb-10">
                   <div className="flex flex-col">
                      <h3 className={cn("text-2xl font-black tracking-tight italic", darkMode ? "text-white" : "text-zinc-900")}>
                        {isEditing ? 'Modify Entry' : 'Transaction Detail'}
                      </h3>
                      {!isEditing && (
                         <span className={cn(
                            "text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full w-fit mt-2",
                            selectedTx.isBaki ? "bg-orange-500/10 text-orange-500" : "bg-green-500/10 text-green-500"
                         )}>
                            {selectedTx.isBaki ? 'Unpaid / Due' : 'Settled In Full'}
                         </span>
                      )}
                   </div>
                   <button onClick={() => { setSelectedTx(null); setIsEditing(false); }} className={cn("p-2 rounded-full transition-colors", darkMode ? "bg-white/5 text-zinc-500" : "bg-gray-100 text-gray-400")}>
                     <X size={20} />
                   </button>
                </div>

                <div className="space-y-10">
                   {!isEditing ? (
                     <>
                       <div className={cn("flex flex-col items-center py-10 rounded-[40px] border relative overflow-hidden transition-colors shadow-inner", 
                         darkMode ? "bg-white/5 border-white/5" : "bg-zinc-50 border-gray-100")}>
                          <div className={cn(
                            "absolute top-0 right-0 px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-bl-3xl",
                            selectedTx.type === 'SALE' ? "bg-green-500 text-white" : "bg-red-500 text-white"
                          )}>
                            {selectedTx.type === 'SALE' ? 'Sale' : 'Expense'}
                          </div>
                          <p className={cn("text-[10px] font-black uppercase tracking-[0.3em] mb-3", darkMode ? "text-zinc-600" : "text-gray-400")}>Transaction Amount</p>
                          <p className={cn("text-5xl font-black italic tracking-tighter", 
                            selectedTx.type === 'SALE' ? "text-green-500" : (darkMode ? "text-white" : "text-[#1D1D1F]"))}>
                             Tk {selectedTx.amount.toLocaleString()}
                          </p>
                          {selectedTx.type === 'SALE' && !selectedTx.isBaki && (
                            <div className="mt-6 flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-full shadow-xl shadow-blue-500/20 active:scale-95 transition-transform">
                              <CheckCircle size={16} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Payment Cleared</span>
                            </div>
                          )}
                       </div>

                       <div className="grid grid-cols-2 gap-x-8 gap-y-10 px-4">
                           <DetailItem icon={<Calendar className="text-blue-500" size={20} />} label="Timestamp" value={format(new Date(selectedTx.timestamp), 'PPP p')} darkMode={darkMode} />
                           <DetailItem icon={<Tag className="text-blue-500" size={20} />} label="Category" value={selectedTx.category || 'Uncategorized'} darkMode={darkMode} />
                           <DetailItem icon={<SmartphoneNfc className="text-blue-500" size={20} />} label="Reference ID" value={`#${selectedTx.id.slice(-6).toUpperCase()}`} darkMode={darkMode} />
                           <DetailItem icon={<TrendingUp className="text-blue-500" size={20} />} label="Cash Flow" value={selectedTx.type} darkMode={darkMode} />
                       </div>

                        <div className="space-y-4 px-4 pt-4 border-t border-white/5">
                           <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", darkMode ? "text-zinc-600" : "text-gray-400")}>Attachments & Proofs</p>
                           <div className="flex flex-wrap gap-3">
                              {(selectedTx.attachments || []).map((url, i) => (
                                <motion.a 
                                  key={i} href={url} target="_blank" rel="noreferrer"
                                  whileHover={{ scale: 1.05 }}
                                  className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shadow-sm"
                                >
                                  <img src={url} className="w-full h-full object-cover" alt="Attachment" />
                                </motion.a>
                              ))}
                              <PhotoUpload 
                                darkMode={darkMode}
                                onUpload={handleAddPhoto}
                                label="Add Proof"
                                className="w-auto h-20"
                              />
                           </div>
                        </div>
                     </>
                   ) : (
                     <div className="space-y-6">
                        <div>
                           <label className={cn("text-[10px] font-black uppercase tracking-widest px-2 pb-2 block", darkMode ? "text-zinc-500" : "text-gray-400")}>Description</label>
                           <input 
                              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                           />
                        </div>
                        <div>
                           <label className={cn("text-[10px] font-black uppercase tracking-widest px-2 pb-2 block", darkMode ? "text-zinc-500" : "text-gray-400")}>Amount (Tk)</label>
                           <input 
                              type="number"
                              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold text-gray-900 outline-none focus:ring-1 focus:ring-blue-500"
                              value={editForm.amount}
                              onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
                           />
                        </div>
                        <div>
                           <label className={cn("text-[10px] font-black uppercase tracking-widest px-2 pb-2 block", darkMode ? "text-zinc-500" : "text-gray-400")}>Category</label>
                           <select 
                              className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold text-gray-900 outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                              value={editForm.category}
                              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                           >
                              <option value="">Select Category</option>
                              {CATEGORIES[selectedTx.type].map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                           <span className="font-bold text-gray-700">Mark as Unpaid (Baki)</span>
                           <input 
                              type="checkbox"
                              className="w-6 h-6 accent-blue-600"
                              checked={editForm.isBaki}
                              onChange={(e) => setEditForm({ ...editForm, isBaki: e.target.checked })}
                           />
                        </div>

                        {editForm.isBaki && (
                          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                              <label className={cn("text-[10px] font-black uppercase tracking-widest px-2 pb-2 block", darkMode ? "text-zinc-500" : "text-gray-400")}>Due Date</label>
                              <input 
                                 type="date"
                                 className={cn("w-full border rounded-2xl p-4 font-bold outline-none focus:ring-1 focus:ring-blue-500 transition-colors", 
                                   darkMode ? "bg-white/5 border-white/5 text-white" : "bg-gray-50 border-gray-100 text-[#1D1D1F]")}
                                value={editForm.dueDate}
                                onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                             />
                          </div>
                        )}

                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 pb-2 block">Recurrence (Automation)</label>
                           <div className="grid grid-cols-2 gap-2">
                              {['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'].map((r) => (
                                <button
                                  key={r}
                                  onClick={() => setEditForm({ ...editForm, recurrence: r as any })}
                                  className={cn(
                                    "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                    editForm.recurrence === r ? "bg-zinc-900 text-white border-zinc-900" : "bg-gray-50 text-gray-400 border-transparent"
                                  )}
                                >
                                  {r === 'NONE' ? 'One-time' : r}
                                </button>
                              ))}
                           </div>
                        </div>
                     </div>
                   )}

                   {selectedTx.metadata && !isEditing && (
                      <div className={cn("p-6 rounded-[40px] space-y-6 transition-colors", darkMode ? "bg-white/5" : "bg-gray-50")}>
                         <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                               <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1 italic", darkMode ? "text-zinc-600" : "text-gray-400")}>Receipt Extraction</p>
                               {selectedTx.metadata.vendor ? (
                                  <h4 className="text-xl font-black italic tracking-tight text-blue-600">{selectedTx.metadata.vendor}</h4>
                               ) : (
                                  <p className={cn("text-sm font-bold opacity-50", darkMode ? "text-white" : "text-gray-500")}>Unnamed Vendor</p>
                               )}
                            </div>
                            <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                               <SmartphoneNfc size={22} />
                            </div>
                         </div>
                         
                         <div className={cn("rounded-3xl border overflow-hidden shadow-sm transition-colors", 
                           darkMode ? "bg-zinc-950/50 border-white/5" : "bg-white border-gray-100")}>
                            <div className={cn("px-5 py-3 flex justify-between border-b transition-colors", 
                              darkMode ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100")}>
                               <span className={cn("text-[10px] font-black uppercase tracking-widest", darkMode ? "text-zinc-500" : "text-gray-400")}>Line Item</span>
                               <span className={cn("text-[10px] font-black uppercase tracking-widest", darkMode ? "text-zinc-500" : "text-gray-400")}>Price</span>
                            </div>
                            <div className={cn("divide-y transition-colors", darkMode ? "divide-white/5" : "divide-gray-50")}>
                               {selectedTx.metadata.items?.map((item: any, i: number) => (
                                  <div key={i} className="px-5 py-4 flex justify-between items-center group transition-colors hover:bg-blue-600/5">
                                     <div className="flex flex-col">
                                        <span className={cn("text-sm font-bold", darkMode ? "text-white" : "text-gray-800")}>{item.name}</span>
                                        <span className={cn("text-[10px] font-bold opacity-50", darkMode ? "text-zinc-500" : "text-gray-400")}>{item.quantity} × unit</span>
                                     </div>
                                     <span className={cn("text-sm font-black", darkMode ? "text-white" : "text-gray-900")}>Tk {item.price}</span>
                                  </div>
                               ))}
                            </div>
                         </div>

                         <div className="flex items-center gap-2 p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                            <div className="flex flex-col">
                               <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-none">Digitally Verified Document</p>
                               <p className="text-[8px] text-blue-400 font-medium uppercase tracking-wider mt-0.5">Scanned via Keystone AI • Status: Validated</p>
                            </div>
                         </div>

                         <div className="space-y-3 px-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction Story</p>
                            <div className="relative pl-6 space-y-4 border-l-2 border-dashed border-gray-100">
                               <div className="relative">
                                  <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-blue-600 border-4 border-white shadow-sm"></div>
                                  <p className="text-[11px] font-bold text-gray-800">Receipt Captured</p>
                                  <p className="text-[9px] text-gray-400">{format(new Date(selectedTx.timestamp), 'h:mm a')}</p>
                               </div>
                               <div className="relative">
                                  <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-green-500 border-4 border-white shadow-sm"></div>
                                  <p className="text-[11px] font-bold text-gray-800">Metadata Extracted</p>
                                  <p className="text-[9px] text-gray-400">Gemini AI confirmed {selectedTx.metadata.items?.length || 0} line items</p>
                               </div>
                            </div>
                         </div>

                         {(selectedTx.metadata.tax > 0 || selectedTx.metadata.total) && (
                            <div className="pt-2 space-y-2">
                               {selectedTx.metadata.tax > 0 && (
                                  <div className="flex justify-between text-xs font-bold text-gray-400 px-1">
                                     <span>Tax & Surcharges</span>
                                     <span>Tk {selectedTx.metadata.tax}</span>
                                  </div>
                               )}
                               {selectedTx.metadata.total && (
                                  <div className="flex justify-between text-lg font-black text-gray-900 px-1 pt-2 border-t border-dashed border-gray-200">
                                     <span className="italic">Receipt Total</span>
                                     <span>Tk {selectedTx.metadata.total}</span>
                                  </div>
                               )}
                            </div>
                         )}
                      </div>
                   )}

                   {selectedTx.receiptUrl && !isEditing && (
                      <div className="space-y-3">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Original Receipt</p>
                         <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm aspect-video">
                            <img src={selectedTx.receiptUrl} alt="Receipt" className="w-full h-full object-cover" />
                         </div>
                      </div>
                   )}

                   <div className="pt-4 flex flex-col gap-3">
                      {isEditing ? (
                         <div className="flex gap-4">
                            <button 
                               onClick={() => setIsEditing(false)}
                               className="flex-1 bg-white border border-gray-200 text-gray-700 py-4 rounded-2xl font-bold transition-all active:scale-[0.98]"
                            >
                               Cancel
                            </button>
                            <button 
                               onClick={handleEditTx}
                               disabled={updating}
                               className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
                            >
                               {updating ? 'Saving...' : 'Save Changes'}
                            </button>
                         </div>
                      ) : (
                         <>
                            <button 
                              onClick={() => handleTogglePaid(selectedTx)}
                              disabled={updating}
                              className={cn(
                                "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 transition-all",
                                selectedTx.isBaki 
                                  ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-100" 
                                  : "bg-orange-50 border-orange-100 text-orange-600"
                              )}
                            >
                               {selectedTx.isBaki ? <><CheckCircle size={18} /> Mark as Paid</> : <><AlertCircle size={18} /> Mark as Unpaid (Baki)</>}
                            </button>

                            <div className="flex gap-4">
                               <button 
                                 onClick={() => startEditing(selectedTx)}
                                 className="flex-1 bg-white border border-blue-100 text-blue-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
                               >
                                  Edit
                               </button>
                               <button 
                                 onClick={handleDeleteTx}
                                 className="flex-1 bg-white border border-red-100 text-red-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
                               >
                                  Delete
                               </button>
                            </div>
                            
                            <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100">
                               <FileText size={18} /> Share Receipt
                            </button>
                         </>
                      )}
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailItem({ icon, label, value, darkMode }: { icon: any, label: string, value: string, darkMode?: boolean }) {
    return (
        <div className="space-y-1">
            <p className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-2", 
              darkMode ? "text-zinc-600" : "text-gray-400")}>
                {icon} {label}
            </p>
            <p className={cn("text-sm font-bold leading-tight", darkMode ? "text-white" : "text-gray-800")}>{value}</p>
        </div>
    );
}
