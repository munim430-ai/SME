import React from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle,
  CircleDollarSign,
  ArrowRight,
  Info
} from 'lucide-react';
import { UserProfile, Language, Transaction } from '../../types';
import { calculateCreditScore, getCreditStatus } from '../../lib/creditScore';
import { cn } from '../../lib/utils';

interface Props {
  setView: (view: any) => void;
  lang: Language;
  transactions: Transaction[];
  profile: UserProfile | null;
}

export default function LoanPredictorView({ setView, lang, transactions, profile, darkMode }: Props & { darkMode?: boolean }) {
  const score = calculateCreditScore(transactions);
  const status = getCreditStatus(score);

  const getConfidenceLevel = (s: number) => {
    if (s >= 800) return "High Confidence";
    if (s >= 650) return "Medium-High";
    if (s >= 500) return "Medium";
    return "Low Probability";
  };

  return (
    <div className={cn("h-full flex flex-col transition-colors duration-300", 
      darkMode ? "bg-zinc-950 text-white" : "bg-white text-zinc-900")}>
      <div className={cn("p-6 pt-12 border-b sticky top-0 z-10 transition-colors",
        darkMode ? "bg-zinc-900 border-white/5" : "bg-white border-gray-50")}>
         <div className="flex items-center gap-4 mb-4">
            <button onClick={() => setView('services')} className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              darkMode ? "bg-white/5 text-zinc-400" : "bg-gray-50 text-gray-500")}>
               <ChevronLeft size={24} />
            </button>
            <h2 className={cn("text-xl font-black italic tracking-tight transition-colors",
              darkMode ? "text-white" : "text-zinc-950")}>Loan Predictor</h2>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
         {/* Score Visual */}
         <div className={cn("rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl transition-all",
           darkMode ? "bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-none border border-white/5" : "bg-zinc-900")}>
            <div className="absolute top-0 right-0 p-6 opacity-10">
               <CircleDollarSign size={120} />
            </div>
            
            <div className="relative z-10">
               <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Estimated Eligibility Score</p>
               <div className="flex items-baseline gap-2 mb-6">
                  <h3 className="text-6xl font-black italic">{score}</h3>
                  <span className="text-sm font-bold text-zinc-500">/ 1000</span>
               </div>

               <div className="flex items-center gap-3">
                  <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors", 
                    status.color.replace('text-', 'bg-').replace('-600', '-500/20').replace('-500', '-500/20'))}>
                     {status.label}
                  </div>
                  <p className="text-[10px] font-bold text-zinc-400 capitalize">{getConfidenceLevel(score)}</p>
               </div>
            </div>
         </div>

         {/* Detailed Insights */}
         <div className="space-y-4">
            <h4 className={cn("text-xs font-black uppercase tracking-widest transition-colors",
              darkMode ? "text-zinc-500" : "text-gray-400")}>Eligibility Analysis</h4>
            
            <div className="grid grid-cols-1 gap-3">
               <AnalysisCard 
                 title="Repayment History" 
                 value="Excellent" 
                 desc="Consistent on-time baki clearing."
                 status="positive"
                 darkMode={darkMode}
               />
               <AnalysisCard 
                 title="Cash Flow Volume" 
                 value={`Tk ${transactions.filter(t => t.type === 'SALE').reduce((a, b) => a + b.amount, 0).toLocaleString()}`} 
                 desc="Healthy transaction turnover."
                 status="neutral"
                 darkMode={darkMode}
               />
               <AnalysisCard 
                 title="Market Stability" 
                 value="Stable" 
                 desc="Consistent activity in last 30 days."
                 status="positive"
                 darkMode={darkMode}
               />
            </div>
         </div>

         {/* Prediction Result */}
         <div className={cn("p-6 rounded-[32px] border italic transition-colors",
           darkMode ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100")}>
            <div className="flex items-start gap-4">
               <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm shrink-0 transition-colors",
                 darkMode ? "bg-blue-600/10 text-blue-400" : "bg-white text-blue-600")}>
                  <Info size={20} />
               </div>
               <div>
                  <p className={cn("text-sm font-bold leading-snug transition-colors",
                    darkMode ? "text-blue-100" : "text-gray-900")}>
                     Based on your business activity, you are likely eligible for a micro-loan of up to 
                     <span className={cn("transition-colors", darkMode ? "text-blue-400" : "text-blue-600")}> Tk {Math.round(score * 100).toLocaleString()}</span>.
                  </p>
                  <p className={cn("text-[10px] mt-2 font-medium transition-colors",
                    darkMode ? "text-zinc-500" : "text-gray-400")}>Terms: 12 months, 9% annual reducing interest.</p>
               </div>
            </div>
         </div>

         <button className={cn("w-full py-5 rounded-[24px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all",
           darkMode ? "bg-white text-zinc-950" : "bg-zinc-900 text-white")}>
            Apply Now <ArrowRight size={18} />
         </button>
      </div>
    </div>
  );
}

function AnalysisCard({ title, value, desc, status, darkMode }: { title: string, value: string, desc: string, status: 'positive' | 'neutral' | 'negative', darkMode?: boolean }) {
  return (
    <div className={cn("p-5 rounded-3xl border shadow-sm flex items-start gap-4 transition-colors",
      darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-50")}>
       <div className={cn(
         "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
         status === 'positive' 
           ? (darkMode ? "bg-green-500/10 text-green-400" : "bg-green-50 text-green-600") 
           : status === 'neutral' 
             ? (darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600") 
             : (darkMode ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600")
       )}>
          {status === 'positive' ? <ShieldCheck size={20} /> : status === 'neutral' ? <TrendingUp size={20} /> : <AlertCircle size={20} />}
       </div>
       <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
             <p className={cn("text-[10px] font-black uppercase tracking-widest transition-colors",
               darkMode ? "text-zinc-500" : "text-gray-400")}>{title}</p>
             <p className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", 
               status === 'positive' ? "text-green-600" : status === 'neutral' ? "text-blue-600" : "text-red-600")}>{value}</p>
          </div>
          <p className={cn("text-xs font-bold transition-colors",
            darkMode ? "text-zinc-300" : "text-zinc-900")}>{desc}</p>
       </div>
    </div>
  );
}
