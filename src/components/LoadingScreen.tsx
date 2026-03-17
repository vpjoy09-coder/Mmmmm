import React from 'react';
import { motion } from 'motion/react';
import { Activity, Heart, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface LoadingScreenProps {
  onComplete?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      {/* Central Core */}
      <div className="relative">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 rounded-full border-4 border-rose-500/30 border-t-rose-500 flex items-center justify-center"
        >
          <Heart className="w-12 h-12 text-rose-500 fill-rose-500/20" />
        </motion.div>
        
        {/* Orbiting Elements */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              rotate: [0, 360],
            }}
            transition={{ duration: 3 + i, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-20px] rounded-full border border-white/10"
            style={{ rotate: i * 120 }}
          >
            <motion.div
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-rose-400 rounded-full shadow-[0_0_10px_rgba(251,113,133,0.8)]"
            />
          </motion.div>
        ))}
      </div>

      {/* Progress Text */}
      <div className="mt-12 text-center space-y-4">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-black tracking-[0.3em] uppercase italic text-white"
        >
          Initializing Shreya
        </motion.h2>
        
        <div className="flex flex-col items-center space-y-2">
          <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, ease: "easeInOut" }}
              onAnimationComplete={onComplete}
              className="h-full bg-gradient-to-r from-rose-500 to-fuchsia-500"
            />
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <Activity className="w-3 h-3 animate-pulse" />
            <span>Neural Pathways Synchronizing...</span>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-8 left-8 flex items-center space-x-3 opacity-30">
        <Zap className="w-4 h-4 text-rose-500" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">System v4.0.2</span>
      </div>
    </motion.div>
  );
};
