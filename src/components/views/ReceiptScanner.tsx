import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'motion/react';
import { Camera, RefreshCw, CheckCircle, ChevronLeft, ShoppingBag, ArrowRight } from 'lucide-react';
import { extractReceiptData } from '../../lib/gemini';
import { TRANSLATIONS } from '../../constants';
import { UserProfile, Language } from '../../types';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { cn } from '../../lib/utils';
import confetti from 'canvas-confetti';

export default function ReceiptScanner({ setView, lang, profile, darkMode }: { setView: (v: any) => void, lang: Language, profile: UserProfile | null, darkMode?: boolean }) {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<{items: any[], total: number, vendor?: string} | null>(null);
  const [type, setType] = useState<'SALE' | 'EXPENSE'>('EXPENSE');
  const [isBaki, setIsBaki] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [recurrence, setRecurrence] = useState<'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'>('NONE');
  const t = TRANSLATIONS[lang];

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
      processImage(imageSrc);
    }
  }, [webcamRef]);

  const resetScanner = () => {
    setImgSrc(null);
    setExtractedData(null);
    setScanning(false);
  };

  const processImage = async (image: string) => {
    setScanning(true);
    try {
      const base64 = image.split(',')[1];
      const data = await extractReceiptData(base64);
      setExtractedData(data);
    } catch (e) {
      console.error(e);
      alert("Could not process receipt. Try again.");
      resetScanner();
    } finally {
      setScanning(false);
    }
  };

  const handleConfirm = async () => {
    const uid = auth.currentUser?.uid || profile?.uid;
    if (!extractedData || !uid) return;
    
    try {
      await addDoc(collection(db, 'transactions'), {
        userId: uid,
        type: type,
        amount: extractedData.total,
        isBaki: isBaki,
        description: `${type === 'SALE' ? 'Sale' : 'Receipt'}: ${extractedData.items?.[0]?.name || 'Items'}`,
        timestamp: new Date().toISOString(),
        dueDate: isBaki && dueDate ? new Date(dueDate).toISOString() : null,
        recurrence: recurrence,
        attachments: [imgSrc],
        metadata: {
          ...extractedData,
          scannedAt: new Date().toISOString(),
          version: '1.0'
        }
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#fb923c', '#ffffff']
      });

      setView('dashboard');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'transactions');
    }
  };

  // Logic: Simplified Break-even Calculation for Poultry
  const costPerUnit = extractedData ? extractedData.total / 500 : 0; 
  const gaugePercent = Math.min(100, (costPerUnit / 120) * 100); 

  return (
    <div className={cn("flex flex-col h-full transition-colors duration-300", darkMode ? "bg-zinc-950 text-white" : "bg-[#F5F5F7] text-gray-900")}>
      <div className={cn("p-6 flex items-center gap-4 border-b z-20 pt-12 transition-colors duration-300", 
        darkMode ? "bg-zinc-900/80 border-white/5 backdrop-blur-xl" : "bg-white border-gray-100")}>
         <button onClick={() => setView('dashboard')} className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors",
           darkMode ? "bg-white/5 text-white" : "bg-gray-100 text-gray-500")}>
           <ChevronLeft size={24} />
         </button>
         <div>
            <h2 className={cn("text-2xl font-black italic tracking-tight leading-none", darkMode ? "text-white" : "text-gray-900")}>{t.scanReceipt}</h2>
            <p className="text-[10px] text-orange-500 uppercase font-black tracking-widest mt-2">Vision OCR Active</p>
         </div>
      </div>

      <div className={cn("flex-1 relative flex items-center justify-center m-6 rounded-[40px] border shadow-2xl overflow-hidden transition-colors",
        darkMode ? "bg-black border-white/5" : "bg-gray-200 border-gray-200")}>
        {!imgSrc ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover opacity-80"
              videoConstraints={{ facingMode: "environment" }}
              mirrored={false}
              disablePictureInPicture={true}
              forceScreenshotSourceSize={false}
              imageSmoothing={true}
              onUserMedia={() => {}}
              onUserMediaError={() => {}}
              screenshotQuality={0.92}
            />
            <div className="absolute inset-0 flex items-center justify-center p-12 pointer-events-none">
              <div className="w-full aspect-[1/1.4] border-2 border-orange-500/30 rounded-3xl relative">
                 <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 mb-2">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] bg-orange-600 px-3 py-1 rounded-full text-white shadow-lg">Document Alignment</span>
                 </div>
                 {/* Corners */}
                 <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-orange-500 rounded-tl-2xl"></div>
                 <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-orange-500 rounded-tr-2xl"></div>
                 <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-orange-500 rounded-bl-2xl"></div>
                 <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-orange-500 rounded-br-2xl"></div>

                 {/* Scanning line */}
                 <motion.div 
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-0 right-0 h-[2px] bg-orange-400 shadow-[0_0_15px_#f97316] z-10"
                 />
              </div>
            </div>
            
            <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-4">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Ready to Scan</p>
               <button 
                  onClick={capture}
                  className="w-24 h-24 bg-orange-600 rounded-full flex items-center justify-center p-2 shadow-[0_0_50px_rgba(234,88,12,0.3)] active:scale-95 transition-all group"
               >
                  <div className="w-full h-full rounded-full border-[6px] border-zinc-900 flex items-center justify-center bg-zinc-100 group-hover:bg-white transition-colors">
                     <Camera className="text-zinc-900" size={36} />
                  </div>
               </button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col bg-zinc-950 overflow-y-auto custom-scrollbar">
            <div className="h-48 flex-shrink-0 bg-black flex items-center justify-center overflow-hidden cursor-pointer" onClick={resetScanner}>
               <img src={imgSrc} className="w-full object-contain opacity-40 hover:opacity-100 transition-opacity" alt="Captured" />
               <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">Tap image to retake</div>
            </div>
            
            <div className={cn("flex-1 rounded-t-[40px] p-8 -mt-10 shadow-2xl relative z-10 transition-colors", 
              darkMode ? "bg-zinc-900 text-white" : "bg-white text-gray-900")}>
              {scanning ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                   <div className="relative">
                      <RefreshCw className="animate-spin text-orange-500" size={64} />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
                      </div>
                   </div>
                   <div className="text-center">
                      <p className="text-xl font-black italic tracking-tight">Analyzing Receipt...</p>
                      <p className={cn("text-xs font-medium px-8 mt-2", darkMode ? "text-zinc-500" : "text-gray-400")}>Gemini is extracting line items, taxes, and vendor details</p>
                   </div>
                </div>
              ) : extractedData && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                   <div className="flex flex-col gap-1">
                      <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", darkMode ? "text-zinc-500" : "text-gray-400")}>Data Confirmation</p>
                      
                      <div className="flex gap-2 mb-4 mt-2">
                        {['EXPENSE', 'SALE'].map((t) => (
                          <button
                            key={t}
                            onClick={() => setType(t as any)}
                            className={cn(
                              "flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                              type === t 
                                ? (t === 'SALE' ? "bg-green-600 text-white border-green-600 shadow-md" : "bg-red-600 text-white border-red-600 shadow-md")
                                : (darkMode ? "bg-white/5 text-zinc-500 border-white/5" : "bg-white text-gray-400 border-gray-100")
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                         <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-green-600 font-bold bg-green-500/10 px-3 py-1 rounded-full text-xs w-fit">
                              <CheckCircle size={14} />
                              Successful
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer mt-1">
                              <input 
                                type="checkbox" 
                                checked={isBaki} 
                                onChange={(e) => setIsBaki(e.target.checked)}
                                className="w-4 h-4 accent-blue-600"
                              />
                              <span className={cn("text-[10px] font-black uppercase tracking-widest", darkMode ? "text-zinc-600" : "text-gray-400")}>Mark as Baki</span>
                            </label>
                         </div>
                         <div className="text-right">
                            <input 
                              type="number"
                              value={extractedData.total}
                              onChange={(e) => setExtractedData({ ...extractedData, total: Number(e.target.value) })}
                              className={cn("text-3xl font-black italic tracking-tighter bg-transparent text-right outline-none focus:ring-1 rounded-lg w-32",
                                darkMode ? "text-white focus:ring-white/10" : "text-zinc-900 focus:ring-blue-100")}
                            />
                            <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-1">Tap to edit amount</p>
                         </div>
                      </div>
                   </div>
 
                   <div className="space-y-4">
                      <div className={cn("flex items-center justify-between border-b pb-2", darkMode ? "border-white/5" : "border-gray-100")}>
                         <h3 className={cn("text-xs font-black uppercase tracking-widest", darkMode ? "text-zinc-600" : "text-gray-400")}>Line Items ({extractedData.items.length})</h3>
                      </div>
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                         {extractedData.items.map((item, idx) => (
                           <div key={idx} className={cn("flex justify-between items-start text-sm p-4 rounded-2xl border transition-colors",
                             darkMode ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100")}>
                              <div className="flex flex-col">
                                 <span className={cn("font-bold", darkMode ? "text-white" : "text-gray-800")}>{item.name}</span>
                                 <span className={cn("text-[10px] font-black uppercase", darkMode ? "text-zinc-500" : "text-gray-400")}>Qty: {item.quantity || 1}</span>
                              </div>
                              <span className={cn("font-black", darkMode ? "text-white" : "text-zinc-900")}>Tk {item.price}</span>
                           </div>
                         ))}
                      </div>
                   </div>
 
                   <div className="pt-6 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn("text-[10px] font-black uppercase tracking-widest", darkMode ? "text-zinc-600" : "text-gray-400")}>AI Business Insight</span>
                        <div className="flex items-center gap-1">
                           <div className={cn("w-2 h-2 rounded-full", gaugePercent > 70 ? "bg-red-500 animate-pulse" : "bg-green-500")}></div>
                           <span className={cn("text-[10px] font-black uppercase tracking-widest", gaugePercent > 70 ? "text-red-500" : "text-green-500")}>
                              {gaugePercent > 70 ? 'Risk Alert' : 'Healthy Trend'}
                           </span>
                        </div>
                      </div>
                      
                      <div className={cn("relative h-4 rounded-full overflow-hidden flex mb-6", darkMode ? "bg-white/5" : "bg-gray-100")}>
                         <div className="h-full bg-green-500/80" style={{ width: '40%' }}></div>
                         <div className="h-full bg-yellow-500/80" style={{ width: '30%' }}></div>
                         <div className="h-full bg-red-500/80" style={{ width: '30%' }}></div>
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                      </div>
                      
                      <motion.div 
                        initial={{ left: 0 }}
                        animate={{ left: `${gaugePercent}%` }}
                        className="relative mt-[-22px] z-20"
                      >
                         <div className={cn("absolute bottom-0 w-1 h-6 rounded-full -translate-x-1/2 border-2 shadow-sm",
                           darkMode ? "bg-white border-zinc-900" : "bg-zinc-900 border-white")}></div>
                      </motion.div>
  
                      <div className={cn("p-5 rounded-[32px] border mt-10 transition-colors shadow-inner", 
                        darkMode ? "bg-white/5 border-white/5" : "bg-blue-50/50 border-blue-100/50")}>
                        <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", darkMode ? "text-blue-400" : "text-blue-600")}>AI Recommendation</p>
                        <p className={cn("text-xs font-black italic leading-relaxed", darkMode ? "text-blue-100/70" : "text-blue-800")}>
                           Calculated cost per unit: <span className="text-blue-500">Tk {costPerUnit.toFixed(2)}</span>. 
                           This contributes to <span className="text-blue-500">{(gaugePercent/1.2).toFixed(0)}%</span> of your current market safety margin.
                        </p>
                      </div>
                   </div>
  
                   <div className="flex flex-col gap-4 pt-6">
                      <div className="flex gap-4">
                        <button 
                          onClick={resetScanner}
                          className={cn("flex-1 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-[0.98]",
                            darkMode ? "bg-white/5 text-zinc-500 hover:bg-white/10" : "bg-gray-100 text-gray-400 hover:bg-gray-200")}
                        >
                          Retake
                        </button>
                        <button 
                          onClick={handleConfirm}
                          className="flex-[2] bg-orange-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl shadow-orange-600/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                        >
                          Confirm Entry <ArrowRight size={18} />
                        </button>
                      </div>
                      <p className={cn("text-[9px] text-center font-black uppercase tracking-widest opacity-30", darkMode ? "text-white" : "text-zinc-400")}>Digital Audit Trail Active</p>
                   </div>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
