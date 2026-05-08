import React from 'react';
import { motion } from 'motion/react';
import { APP_NAME } from '../../constants';

export default function SplashView({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#141414] text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
        className="relative w-32 h-32 flex items-center justify-center mb-8"
      >
        <div className="absolute inset-0 border-4 border-white opacity-20 transform rotate-45 rounded-xl"></div>
        <div className="text-4xl font-bold tracking-tighter">KS</div>
      </motion.div>
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-medium tracking-tight"
      >
        {APP_NAME}
      </motion.h1>
      <p className="mt-2 text-gray-500 text-sm">Empowering Rural SMEs</p>
    </div>
  );
}
