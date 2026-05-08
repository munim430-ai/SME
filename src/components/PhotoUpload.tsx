import React, { useRef, useState } from 'react';
import { Camera, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Props {
  onUpload: (url: string) => void;
  darkMode?: boolean;
  label?: string;
  className?: string;
}

export default function PhotoUpload({ onUpload, darkMode, label = 'Add Photo', className }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic size check (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large. Please select an image under 2MB.");
      return;
    }

    setIsUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
        onUpload(base64String);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      setIsUploading(false);
    }
  };

  const clear = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={cn("relative", className)}>
      <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/10"
          >
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <button 
              onClick={clear}
              className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white"
            >
              <X size={12} />
            </button>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-bold transition-all",
              darkMode 
                ? "bg-white/5 border-white/10 text-white hover:bg-white/10" 
                : "bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100"
            )}
          >
            {isUploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Camera size={18} />
            )}
            {label}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
