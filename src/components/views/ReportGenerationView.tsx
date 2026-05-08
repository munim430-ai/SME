import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { TRANSLATIONS } from '../../constants';
import { UserProfile, Language, Transaction } from '../../types';
import { 
  ChevronLeft, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3, 
  FileText,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isWithinInterval } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart as RePieChart,
  Pie
} from 'recharts';

export default function ReportGenerationView({ setView, lang, transactions, darkMode }: { setView: (v: any) => void, lang: Language, transactions: Transaction[], darkMode?: boolean }) {
  const t = TRANSLATIONS[lang];
  const [timeRange, setTimeRange] = useState<'this_month' | 'last_month' | 'last_3_months' | 'year'>('this_month');

  const filteredData = useMemo(() => {
    const now = new Date();
    let start = startOfMonth(now);
    let end = endOfMonth(now);

    if (timeRange === 'last_month') {
      start = startOfMonth(subMonths(now, 1));
      end = endOfMonth(subMonths(now, 1));
    } else if (timeRange === 'last_3_months') {
      start = startOfMonth(subMonths(now, 3));
    } else if (timeRange === 'year') {
      start = startOfMonth(subMonths(now, 12));
    }

    return transactions.filter(tx => {
      const date = new Date(tx.timestamp);
      return isWithinInterval(date, { start, end });
    });
  }, [transactions, timeRange]);

  const stats = useMemo(() => {
    const income = filteredData.filter(t => t.type === 'SALE').reduce((a, b) => a + b.amount, 0);
    const expense = filteredData.filter(t => t.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0);
    const baki = filteredData.filter(t => t.isBaki).reduce((a, b) => a + b.amount, 0);
    const topCategory = Object.entries(
      filteredData.reduce((acc: any, cur) => {
        acc[cur.category || 'Other'] = (acc[cur.category || 'Other'] || 0) + cur.amount;
        return acc;
      }, {})
    ).sort((a: any, b: any) => b[1] - a[1])[0] || ['None', 0];

    return { income, expense, profit: income - expense, baki, topCategory };
  }, [filteredData]);

  const chartData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), timeRange === 'year' ? 11 : timeRange === 'last_3_months' ? 2 : 0),
      end: new Date()
    });

    return months.map(m => {
      const monthStr = format(m, 'MMM');
      const mData = transactions.filter(t => format(new Date(t.timestamp), 'MMM yyyy') === format(m, 'MMM yyyy'));
      return {
        name: monthStr,
        income: mData.filter(t => t.type === 'SALE').reduce((a, b) => a + b.amount, 0),
        expense: mData.filter(t => t.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0)
      };
    });
  }, [transactions, timeRange]);

  const pieData = useMemo(() => {
    const cats = filteredData.reduce((acc: any, cur) => {
      acc[cur.category || 'Other'] = (acc[cur.category || 'Other'] || 0) + cur.amount;
      return acc;
    }, {});
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const exportReport = () => {
    const headers = ['Category', 'Value'];
    const rows = [
      ['Total Income', stats.income],
      ['Total Expense', stats.expense],
      ['Net Profit', stats.profit],
      ['Unpaid (Baki)', stats.baki],
      ['Top Category', stats.topCategory[0]]
    ];
    
    let csvContent = "data:text/csv;charset=utf-8,Financial Health Report - " + format(new Date(), 'yyyy-MM-dd') + "\n\n";
    csvContent += headers.join(",") + "\n";
    rows.forEach(row => csvContent += row.join(",") + "\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `keystone_report_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={cn("flex flex-col h-full transition-colors duration-300", 
      darkMode ? "bg-zinc-950 text-white" : "bg-[#fbfbfb] text-zinc-900")}>
      <div className={cn("p-6 flex items-center justify-between sticky top-0 z-20 border-b transition-colors",
        darkMode ? "bg-zinc-900 border-white/5" : "bg-white border-gray-100")}>
         <button onClick={() => setView('dashboard')} className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors",
           darkMode ? "bg-white/5 text-zinc-400 hover:text-white" : "bg-gray-50 text-gray-500")}>
           <ChevronLeft size={24} />
         </button>
         <h2 className={cn("text-xl font-black tracking-tight italic uppercase transition-colors",
           darkMode ? "text-white" : "text-zinc-950")}>Financial Insights</h2>
         <button onClick={exportReport} className={cn("w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95",
           darkMode ? "bg-blue-600 text-white shadow-blue-500/10" : "bg-zinc-900 text-white shadow-zinc-200")}>
           <Download size={20} />
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
         {/* Time Range Selector */}
         <div className={cn("flex gap-2 p-1 rounded-2xl transition-colors",
           darkMode ? "bg-white/5" : "bg-gray-100")}>
            {[
              { id: 'this_month', label: 'Month' },
              { id: 'last_3_months', label: 'Quarter' },
              { id: 'year', label: 'Year' }
            ].map(r => (
              <button 
                key={r.id}
                onClick={() => setTimeRange(r.id as any)}
                className={cn(
                  "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                  timeRange === r.id 
                    ? (darkMode ? "bg-blue-600 text-white shadow-sm" : "bg-white text-zinc-900 shadow-sm") 
                    : (darkMode ? "text-zinc-500 hover:text-zinc-300" : "text-gray-400 hover:text-gray-600")
                )}
              >
                {r.label}
              </button>
            ))}
         </div>

         {/* Hero Stats */}
         <div className="grid grid-cols-2 gap-4">
            <div className={cn("p-5 rounded-[32px] border shadow-sm space-y-2 transition-colors",
              darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-50")}>
               <div className="flex items-center gap-2 text-green-600">
                  <TrendingUp size={16} />
                  <span className={cn("text-[10px] font-black uppercase tracking-widest transition-colors",
                    darkMode ? "text-zinc-500" : "text-gray-400")}>Revenue</span>
               </div>
               <p className={cn("text-2xl font-black transition-colors", darkMode ? "text-white" : "text-zinc-900")}>
                Tk {stats.income.toLocaleString()}
               </p>
               <div className="flex items-center gap-1 text-[10px] font-bold text-green-500">
                  <ArrowUpRight size={12} /> Healthy Flow
               </div>
            </div>
            <div className={cn("p-5 rounded-[32px] border shadow-sm space-y-2 transition-colors",
              darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-50")}>
               <div className="flex items-center gap-2 text-orange-600">
                  <TrendingDown size={16} />
                  <span className={cn("text-[10px] font-black uppercase tracking-widest transition-colors",
                    darkMode ? "text-zinc-500" : "text-gray-400")}>Expenses</span>
               </div>
               <p className={cn("text-2xl font-black transition-colors", darkMode ? "text-white" : "text-zinc-900")}>
                Tk {stats.expense.toLocaleString()}
               </p>
               <div className="flex items-center gap-1 text-[10px] font-bold text-orange-500">
                  <Layers size={12} /> Managed
               </div>
            </div>
         </div>

         {/* Profit Card */}
         <div className={cn("p-8 rounded-[40px] text-white relative overflow-hidden transition-all",
           darkMode ? "bg-gradient-to-br from-indigo-600 to-blue-700 shadow-xl shadow-blue-900/40" : "bg-zinc-900")}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-1">Net Worth Velocity</p>
            <div className="flex items-end gap-3">
               <p className="text-5xl font-black italic tracking-tighter">Tk {stats.profit.toLocaleString()}</p>
               <div className="mb-2 bg-white/10 px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                  {stats.profit >= 0 ? 'Surplus' : 'Deficit'}
               </div>
            </div>
            <div className="mt-8 flex justify-between items-center bg-white/5 p-4 rounded-3xl border border-white/10">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-white/60">
                     <PieChart size={20} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Top Cost</p>
                     <p className="text-sm font-bold">{stats.topCategory[0]}</p>
                  </div>
               </div>
               <ArrowRight className="text-white/20" size={20} />
            </div>
         </div>

         {/* Real Charts */}
         <div className={cn("p-6 rounded-[40px] border shadow-sm transition-colors",
           darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-50")}>
            <h3 className={cn("text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 transition-colors",
              darkMode ? "text-zinc-500" : "text-gray-400")}>
               <BarChart3 size={16} className="text-blue-500" />
               Performance Trend
            </h3>
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#333" : "#f0f0f0"} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: darkMode ? '#555' : '#A1A1AA' }}
                    />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }} 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                        fontSize: '12px', 
                        fontWeight: 'bold',
                        backgroundColor: darkMode ? '#18181b' : '#fff',
                        color: darkMode ? '#fff' : '#000'
                      }}
                      itemStyle={{ color: darkMode ? '#fff' : '#000' }}
                    />
                    <Bar dataKey="income" fill="#10B981" radius={[6, 6, 0, 0]} barSize={20} />
                    <Bar dataKey="expense" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={20} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-4">
            <div className={cn("p-6 rounded-[40px] border shadow-sm col-span-2 transition-colors",
              darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-50")}>
                <h3 className={cn("text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 transition-colors",
                  darkMode ? "text-zinc-500" : "text-gray-400")}>
                   <Layers size={16} className="text-orange-500" />
                   Category Distribution
                </h3>
                <div className="flex items-center gap-4">
                   <div className="h-40 w-1/2">
                      <ResponsiveContainer width="100%" height="100%">
                         <RePieChart>
                           <Pie
                             data={pieData}
                             cx="50%"
                             cy="50%"
                             innerRadius={40}
                             outerRadius={60}
                             paddingAngle={5}
                             dataKey="value"
                           >
                             {pieData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                           </Pie>
                         </RePieChart>
                      </ResponsiveContainer>
                   </div>
                   <div className="space-y-2 flex-1">
                      {pieData.slice(0, 4).map((entry, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                           <p className={cn("text-[10px] font-bold truncate transition-colors",
                             darkMode ? "text-zinc-400" : "text-gray-600")}>{entry.name}</p>
                        </div>
                      ))}
                   </div>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}
