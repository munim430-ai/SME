import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Mic, 
  MicOff, 
  X, 
  Bot, 
  Sparkles, 
  Volume2, 
  VolumeX,
  MessageCircle,
  HelpCircle,
  Send
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { UserProfile, Language } from '../../types';
import { cn } from '../../lib/utils';
import Markdown from 'react-markdown';
import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function VoiceAssistantView({ setView, lang, profile, darkMode }: { setView: (v: any) => void, lang: Language, profile: UserProfile | null, darkMode?: boolean }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTextMode, setShowTextMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing, transcript]);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = lang === 'bn' ? 'bn-BD' : 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      window.speechSynthesis.cancel();
    };
  }, [lang]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isProcessing) return;

    setMessages(prev => [...prev, { role: 'user', content }]);
    setTranscript('');
    setTextInput('');
    setIsProcessing(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...messages, { role: 'user', content }].map(m => m.content).join('\n'),
        config: {
          systemInstruction: `You are an expert SME (Small and Medium Enterprise) Advisor for Bangladeshi business owners. 
          The user is a business owner using the 'Hishab Nikash' app. Their business is ${profile?.businessCategory || 'General SME'}.
          Provide concise, strategic, and professional business advice.
          
          CAPABILITY: You can also help log transactions. 
          If the user says something like "Add an expense of 500 for feed" or "Log a sale of 2000 for eggs", 
          you should confirm the action in your response and include a JSON block at the end of your message in this format:
          [ACTION:LOG_TRANSACTION:{"type":"SALE"|"EXPENSE","amount":number,"description":string}]
          
          Example: "Sure, logging your sales of 2000 for eggs. [ACTION:LOG_TRANSACTION:{"type":"SALE","amount":2000,"description":"Sale: Eggs"}]"

          Keep answers short and clear, suitable for voice playback.
          Respond in the language the user is speaking (${lang === 'bn' ? 'Bengali' : 'English'}).`,
        },
      });

      const aiResponse = response.text || "I'm sorry, I couldn't generate a response.";
      
      // Intent parsing
      if (aiResponse.includes('[ACTION:LOG_TRANSACTION:')) {
        const match = aiResponse.match(/\[ACTION:LOG_TRANSACTION:(.*?)\]/);
        if (match && match[1]) {
          try {
            const txData = JSON.parse(match[1]);
            const uid = profile?.uid || 'guest-preview';
            await addDoc(collection(db, 'transactions'), {
              userId: uid,
              timestamp: new Date().toISOString(),
              ...txData
            });
            // Clean response for display/speech
            const cleanResponse = aiResponse.replace(/\[ACTION:LOG_TRANSACTION:.*?\]/, '').trim();
            setMessages(prev => [...prev, { role: 'assistant', content: cleanResponse }]);
            speak(cleanResponse);
            return;
          } catch (e) {
            console.error("Failed to parse or save voice transaction", e);
          }
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      
      // Voice Command Parsing
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('open') || lowerContent.includes('go to')) {
        if (lowerContent.includes('khata') || lowerContent.includes('ledger')) setView('khata');
        if (lowerContent.includes('scan') || lowerContent.includes('receipt')) setView('receipt');
        if (lowerContent.includes('rates') || lowerContent.includes('market')) setView('rates');
        if (lowerContent.includes('profile')) setView('profile');
        if (lowerContent.includes('management') || lowerContent.includes('stock')) setView('management');
      }

      // Text to Speech
      speak(aiResponse);
    } catch (error) {
      console.error("AI Assistant Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I encountered an error. Please try again." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'bn' ? 'bn-BD' : 'en-US';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!isListening && transcript.length > 5) {
      handleSendMessage(transcript);
    }
  }, [isListening]);

  return (
    <div className={cn("h-full flex flex-col transition-colors duration-300", 
      darkMode ? "bg-zinc-950 text-white" : "bg-white text-gray-900")}>
      {/* Header */}
      <div className={cn("p-6 pt-12 flex items-center justify-between z-10 sticky top-0 transition-colors",
        darkMode ? "bg-zinc-950/80 backdrop-blur-xl border-b border-white/5" : "bg-white/80 backdrop-blur-xl border-b border-gray-100")}>
         <button onClick={() => setView('dashboard')} className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", 
           darkMode ? "bg-white/5 text-white" : "bg-gray-100 text-gray-500")}>
            <ChevronLeft size={24} />
         </button>
         <div className="text-center">
            <h2 className="text-xl font-black italic tracking-tight flex items-center justify-center gap-2">
               AI Assistant <Sparkles size={16} className="text-amber-400" />
            </h2>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">SME Expert Active</p>
         </div>
         <button onClick={() => setShowTextMode(!showTextMode)} className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors",
           darkMode ? "bg-white/5 text-white" : "bg-gray-100 text-gray-500")}>
            {showTextMode ? <Mic size={20} /> : <MessageCircle size={20} />}
         </button>
      </div>

      {/* Main Interaction Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-8">
         <AnimatePresence mode="wait">
            {!messages.length && !isListening && !transcript && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center space-y-6"
              >
                 <div className={cn("w-24 h-24 rounded-[40px] flex items-center justify-center mx-auto transition-colors",
                   darkMode ? "bg-white/5" : "bg-blue-50")}>
                    <Bot size={48} className="text-blue-600" />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-2xl font-black italic">Hishab Nikash AI</h3>
                    <p className={cn("text-sm max-w-xs transition-colors", darkMode ? "text-zinc-500" : "text-gray-400")}>
                      Your smart partner for business growth and bookkeeping.
                    </p>
                 </div>
                 
                 <div className="flex flex-wrap justify-center gap-2 pt-4">
                    {['Add Sale of 500', 'Expense for feed', 'SME Advice'].map(tip => (
                      <button 
                        key={tip}
                        onClick={() => handleSendMessage(tip)}
                        className={cn("px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors",
                          darkMode ? "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10" : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50")}
                      >
                         {tip}
                      </button>
                    ))}
                 </div>
              </motion.div>
            )}

            {(messages.length > 0 || transcript) && (
              <motion.div 
                key="messages"
                ref={scrollRef}
                className="w-full flex-1 overflow-y-auto space-y-6 pb-24 px-2 custom-scrollbar"
              >
                 {messages.map((msg, idx) => (
                   <motion.div 
                     key={idx}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className={cn(
                       "flex flex-col",
                       msg.role === 'user' ? "items-end" : "items-start"
                     )}
                   >
                      <div className={cn(
                        "p-5 rounded-[28px] max-w-[90%] text-sm font-bold shadow-xl transition-all",
                        msg.role === 'user' 
                          ? "bg-blue-600 text-white rounded-tr-none shadow-blue-500/10" 
                          : (darkMode ? "bg-white/5 text-zinc-100 border border-white/10 rounded-tl-none" : "bg-zinc-50 text-gray-800 border border-gray-100 rounded-tl-none")
                      )}>
                         <Markdown>{msg.content}</Markdown>
                      </div>
                      {msg.role === 'assistant' && idx === messages.length - 1 && (
                        <button 
                          onClick={() => speak(msg.content)} 
                          className="mt-2 p-2 text-zinc-500 hover:text-blue-500 transition-colors"
                        >
                           {isSpeaking ? <Volume2 size={16} className="animate-pulse text-blue-500" /> : <Volume2 size={16} />}
                        </button>
                      )}
                   </motion.div>
                 ))}

                 {transcript && (
                   <div className="flex justify-end">
                      <div className="p-5 rounded-[28px] rounded-tr-none bg-red-600/50 text-white/50 text-sm font-bold animate-pulse">
                         {transcript}
                      </div>
                   </div>
                 )}

                 {isProcessing && (
                   <div className="flex justify-start">
                      <div className="p-5 rounded-[28px] rounded-tl-none bg-white/10 text-zinc-500">
                         <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
                         </div>
                      </div>
                   </div>
                 )}
              </motion.div>
            )}
         </AnimatePresence>
      </div>

      {/* Bottom Interface */}
      <div className={cn("p-10 pb-16 flex flex-col items-center gap-8 transition-colors duration-500",
        darkMode ? "bg-gradient-to-t from-black to-transparent" : "bg-gradient-to-t from-gray-50 to-transparent")}>
         {showTextMode ? (
           <div className="w-full flex gap-3">
              <input 
                type="text"
                placeholder="Type your question..."
                className={cn("flex-1 border rounded-2xl px-6 py-4 outline-none focus:ring-1 transition-all font-bold",
                   darkMode ? "bg-white/5 border-white/10 text-white focus:ring-red-500" : "bg-white border-gray-100 text-gray-900 focus:ring-red-500")}
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage(textInput)}
              />
              <button 
                onClick={() => handleSendMessage(textInput)}
                className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-transform"
              >
                 <Send size={24} />
              </button>
           </div>
         ) : (
           <div className="relative group">
              {isListening && (
                <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping scale-150"></div>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleListening}
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl relative z-10",
                  isListening ? "bg-red-600 shadow-red-600/40" : "bg-white/5 border border-white/10 hover:bg-white/10"
                )}
              >
                 {isListening ? <Mic size={40} className="text-white" /> : <Mic size={40} className="text-red-500" />}
              </motion.button>
              
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                 <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] transition-colors", 
                    darkMode ? "text-zinc-500" : "text-gray-400")}>
                    {isListening ? "Listening..." : "Tap to Speak"}
                 </p>
              </div>
           </div>
         )}
      </div>
    </div>
  );
}
