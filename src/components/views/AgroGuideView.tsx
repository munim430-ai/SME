import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Send, 
  Bot, 
  User as UserIcon,
  Sparkles,
  RefreshCw,
  Plus,
  BookOpen,
  Sprout,
  HeartPulse
} from 'lucide-react';
import { UserProfile, Language } from '../../types';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../../lib/utils';
import Markdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AgroGuideView({ setView, lang, profile, darkMode }: { setView: (v: any) => void, lang: Language, profile: UserProfile | null, darkMode?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your AI Agro Guide. How can I help with your poultry or agriculture business today? You can ask about disease prevention, feed management, or market trends." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...messages, { role: 'user', content: userMessage }].map(m => m.content).join('\n'),
        config: {
          systemInstruction: `You are an expert Agro Advisor for Bangladeshi farmers. You specialize in Poultry, Dairy, and Crop management. 
          The user is a farmer using the 'Hishab Nikash' app. Their business is ${profile?.businessCategory || 'Agro'}.
          Keep advice practical, cost-effective, and safe. If they ask about symptoms, suggest consulting a local vet if it seems serious.
          Respond in the language the user is speaking (${lang === 'bn' ? 'Bengali/Bangla' : 'English'}).`,
        },
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.text || "I'm sorry, I couldn't generate a response." }]);
    } catch (error) {
       console.error("AI Error:", error);
       setMessages(prev => [...prev, { role: 'assistant', content: "Network error. Please check your connection." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const QuickTopic = ({ icon, label, query, darkMode }: { icon: any, label: string, query: string, darkMode?: boolean }) => (
    <button 
      onClick={() => setInput(query)}
      className={cn("flex-1 p-4 rounded-2xl border shadow-sm flex flex-col items-center gap-2 transition-colors",
        darkMode ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-white border-gray-100 hover:bg-gray-50") }
    >
       <div className={cn("transition-colors", darkMode ? "text-blue-400" : "text-blue-500")}>{icon}</div>
       <span className={cn("text-[10px] font-black uppercase tracking-widest text-center transition-colors",
         darkMode ? "text-zinc-500" : "text-gray-500")}>{label}</span>
    </button>
  );

  return (
    <div className={cn("h-full flex flex-col transition-colors duration-300", 
      darkMode ? "bg-zinc-950" : "bg-[#F8F9FA]")}>
      {/* Header */}
      <div className={cn("p-6 pt-12 border-b flex items-center justify-between transition-colors duration-300",
        darkMode ? "bg-zinc-900 border-white/5" : "bg-white border-gray-100")}>
         <div className="flex items-center gap-4">
            <button onClick={() => setView('services')} className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              darkMode ? "bg-white/5 text-zinc-400" : "bg-gray-50 text-gray-500")}>
               <ChevronLeft size={24} />
            </button>
            <div>
               <h2 className={cn("text-xl font-black italic tracking-tight flex items-center gap-2 transition-colors",
                 darkMode ? "text-white" : "text-zinc-900")}>
                 Agro Guide <Sparkles size={16} className="text-amber-400" />
               </h2>
               <p className={cn("text-[10px] font-bold uppercase tracking-widest transition-colors",
                 darkMode ? "text-green-400" : "text-green-600")}>AI Expert Assistant</p>
            </div>
         </div>
         <button onClick={() => setMessages([messages[0]])} className={cn("p-2 transition-colors",
           darkMode ? "text-zinc-500 hover:text-white" : "text-gray-400 hover:text-gray-600")}>
           <RefreshCw size={18} />
         </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
         {messages.length === 1 && (
           <div className="grid grid-cols-2 gap-3 mb-8">
              <QuickTopic icon={<HeartPulse />} label="Disease Diagnosis" query="My chickens have watery discharge from eyes. What should I do?" darkMode={darkMode} />
              <QuickTopic icon={<Sprout />} label="Feed Tips" query="Best feed ratio for 20-day old broilers for maximum weight gain?" darkMode={darkMode} />
              <QuickTopic icon={<BookOpen />} label="General Care" query="Vaccination schedule for Layer chicken in summer?" darkMode={darkMode} />
              <QuickTopic icon={<Plus />} label="New Batch" query="How to prepare broader for 500 new chicks?" darkMode={darkMode} />
           </div>
         )}

         {messages.map((msg, idx) => (
           <motion.div 
             key={idx}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className={cn(
               "flex items-start gap-3",
               msg.role === 'user' ? "flex-row-reverse" : ""
             )}
           >
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-colors",
                msg.role === 'assistant' 
                  ? (darkMode ? "bg-white/5 border-white/5 text-blue-400 shadow-sm" : "bg-white border-gray-100 text-blue-600 shadow-sm") 
                  : (darkMode ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-900 border-zinc-800 text-white")
              )}>
                 {msg.role === 'assistant' ? <Bot size={18} /> : <UserIcon size={18} />}
              </div>
              <div className={cn(
                "p-4 rounded-2xl max-w-[80%] shadow-sm transition-colors",
                msg.role === 'assistant' 
                  ? (darkMode ? "bg-white/5 text-zinc-300 border border-white/5" : "bg-white text-zinc-800 border border-gray-100") 
                  : "bg-blue-600 text-white"
              )}>
                 <div className={cn("markdown-body prose prose-sm max-w-none transition-colors", 
                   darkMode ? "prose-invert" : "")}>
                    <Markdown>{msg.content}</Markdown>
                 </div>
              </div>
           </motion.div>
         ))}
         
         <AnimatePresence>
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                 <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center animate-pulse border transition-colors",
                   darkMode ? "bg-white/5 border-white/5 text-blue-400" : "bg-white border-gray-100 text-blue-600")}>
                    <Bot size={18} />
                 </div>
                 <div className={cn("p-4 rounded-2xl shadow-sm border transition-colors",
                   darkMode ? "bg-white/5 border-white/5" : "bg-white border-gray-50")}>
                    <div className="flex gap-1">
                       <span className={cn("w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]", 
                         darkMode ? "bg-blue-400" : "bg-blue-600")}></span>
                       <span className={cn("w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]",
                         darkMode ? "bg-blue-400" : "bg-blue-600")}></span>
                       <span className={cn("w-1.5 h-1.5 rounded-full animate-bounce",
                         darkMode ? "bg-blue-400" : "bg-blue-600")}></span>
                    </div>
                 </div>
              </motion.div>
            )}
         </AnimatePresence>
      </div>

      {/* Input */}
      <div className={cn("p-6 border-t transition-colors", 
        darkMode ? "bg-zinc-900 border-white/5" : "bg-white border-gray-100")}>
         <div className="flex gap-3">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything..."
              className={cn("flex-1 border rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 transition-all",
                darkMode ? "bg-white/5 border-white/5 text-white focus:ring-blue-500/40 placeholder:text-zinc-600" : "bg-gray-50 border-gray-100 text-zinc-900 focus:ring-blue-500/20 placeholder:text-gray-400") }
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all disabled:opacity-50",
                darkMode ? "bg-blue-600 text-white shadow-blue-900/20" : "bg-zinc-900 text-white") }
            >
               <Send size={24} />
            </button>
         </div>
      </div>
    </div>
  );
}
