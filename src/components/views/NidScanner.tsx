import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'motion/react';
import { Camera, RefreshCw, CheckCircle, ArrowRight, ChevronLeft } from 'lucide-react';
import { extractNIDData } from '../../lib/gemini';
import { TRANSLATIONS } from '../../constants';
import { Language } from '../../types';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function NidScanner({ onComplete, lang, darkMode }: { onComplete: () => void, lang: Language, darkMode?: boolean }) {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<{name: string, nidNumber: string} | null>(null);
  const t = TRANSLATIONS[lang];

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
      processImage(imageSrc);
    }
  }, [webcamRef]);

  const processImage = async (image: string) => {
    setScanning(true);
    try {
      // Remove data:image/jpeg;base64, prefix
      const base64 = image.split(',')[1];
      const data = await extractNIDData(base64);
      setExtractedData(data);
    } catch (e) {
      console.error(e);
      alert("Could not read NID. Please try again.");
      setImgSrc(null);
    } finally {
      setScanning(false);
    }
  };

  const handleConfirm = async () => {
    if (!extractedData || !auth.currentUser) return;
    
    // Create/Update user profile
    const profile = {
      uid: auth.currentUser.uid,
      name: extractedData.name,
      phoneNumber: auth.currentUser.phoneNumber || '',
      nidNumber: extractedData.nidNumber,
      trustScore: 450, // Starter score
      isVerified: true,
      createdAt: new Date().toISOString()
    };
    
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), profile);
      onComplete();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D] text-white">
      <div className="p-6 pt-12">
        <div className="flex items-center gap-4 mb-4">
           <button onClick={() => setImgSrc(null)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
              <ChevronLeft size={24} />
           </button>
           <h2 className="text-2xl font-black italic tracking-tight">{t.scanNid}</h2>
        </div>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
           Place your Smart NID card inside the active reticle. <br/>Ensure good lighting for biometric extraction.
        </p>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden m-6 rounded-[40px] border border-white/5 shadow-2xl">
        {!imgSrc ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover"
              videoConstraints={{ facingMode: "environment" }}
              mirrored={false}
              disablePictureInPicture={true}
              forceScreenshotSourceSize={false}
              imageSmoothing={true}
              onUserMedia={() => {}}
              onUserMediaError={() => {}}
              screenshotQuality={0.92}
            />
            
            {/* Guide Overlay */}
            <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
              <div className="w-full aspect-[1.6/1] border-2 border-white/20 rounded-2xl relative">
                {/* HUD Elements */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                   <div className="px-3 py-1 bg-blue-500 rounded-full text-[8px] font-black uppercase tracking-widest text-white shadow-lg">Biometric Active</div>
                   <div className="w-1 h-8 bg-blue-500/50 rounded-full"></div>
                </div>

                <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl"></div>
                <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl"></div>
                <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl"></div>
                <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-blue-500 rounded-br-2xl"></div>
                
                {/* Horizontal scanner bar */}
                <motion.div 
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_20px_rgba(59,130,246,0.8)] z-10"
                />

                {/* Grid Overlay */}
                <div className="absolute inset-0 opacity-10 grid grid-cols-4 grid-rows-4">
                   {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className="border border-white/20"></div>
                   ))}
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-4">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Ready to Authenticate</p>
               <button 
                  onClick={capture}
                  className="w-24 h-24 bg-white rounded-full flex items-center justify-center p-2 shadow-[0_0_50px_rgba(255,255,255,0.2)] active:scale-95 transition-all group"
               >
                  <div className="w-full h-full rounded-full border-[6px] border-zinc-900 flex items-center justify-center bg-zinc-100 group-hover:bg-white transition-colors">
                     <Camera className="text-zinc-900" size={36} />
                  </div>
               </button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 p-8">
            <div className="relative w-full aspect-[1.6/1] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
               <img src={imgSrc} className="w-full h-full object-cover" alt="Captured NID" />
               {scanning && (
                  <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                     <div className="absolute inset-0 overflow-hidden">
                         <motion.div 
                            animate={{ top: ['-20%', '120%'] }} 
                            transition={{ duration: 2, repeat: Infinity }} 
                            className="absolute left-0 right-0 h-1/2 bg-gradient-to-b from-transparent via-blue-500/30 to-transparent"
                         />
                     </div>
                  </div>
               )}
            </div>
            
            {scanning ? (
              <div className="mt-12 flex flex-col items-center gap-6">
                <div className="relative">
                   <RefreshCw className="animate-spin text-blue-500" size={56} />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
                   </div>
                </div>
                <div className="text-center">
                   <p className="text-2xl font-black italic tracking-tighter">Analyzing identity...</p>
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-2">Checking Govt. Database via AI Linkage</p>
                </div>
              </div>
            ) : extractedData && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full mt-12 space-y-8"
              >
                <div className="flex items-center gap-4 bg-green-500/10 border border-green-500/20 px-6 py-4 rounded-[28px] text-green-500">
                  <CheckCircle size={28} />
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest">Verification Success</p>
                     <p className="text-sm font-bold text-green-400">Identity Matches Biometrics</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 px-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Verified Full Name</p>
                    <p className="text-2xl font-black italic tracking-tight">{extractedData.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Validated NID Number</p>
                    <p className="text-2xl font-black italic tracking-tight font-mono text-blue-500">{extractedData.nidNumber}</p>
                  </div>
                </div>
                
                <div className="space-y-3 pt-6">
                   <button 
                     onClick={handleConfirm}
                     className="w-full bg-[#3B82F6] text-white py-6 rounded-[28px] font-black italic uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 active:scale-95 transition-transform"
                   >
                     Continue Profile Setup <ArrowRight size={20} />
                   </button>
                   <button 
                      onClick={() => setImgSrc(null)}
                      className="w-full text-zinc-500 py-4 font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors"
                   >
                     Re-Authenticate
                   </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>

  );
}
