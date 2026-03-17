import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface SpeechBubbleProps {
  text: string;
  isSpeaking: boolean;
  theme: {
    accent: string;
    glow: string;
    border: string;
  };
}

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({ text, isSpeaking, theme }) => {
  if (!text || text.trim().length === 0) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={text}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -10 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mb-8 z-30"
      >
        <div className={cn(
          "bg-black/40 backdrop-blur-2xl px-6 py-4 rounded-3xl border border-white/10 shadow-2xl relative",
          isSpeaking ? "ring-2 ring-rose-500/20" : ""
        )}>
          {/* Decorative elements */}
          <div className={cn("absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-black/40 border-r border-b border-white/10 rotate-45")} />
          
          <div className="flex items-center space-x-2 mb-2">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              isSpeaking ? cn(theme.accent.replace('text-', 'bg-'), "animate-pulse") : "bg-slate-600"
            )} />
            <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold">
              {isSpeaking ? "Shreya is speaking" : "Shreya is listening"}
            </span>
          </div>

          <p className="text-slate-100 text-sm sm:text-base leading-relaxed font-medium">
            {text}
          </p>
        </div>

        {/* Subtle glow behind bubble */}
        <div className={cn(
          "absolute inset-0 blur-2xl -z-10 opacity-30 transition-colors duration-1000",
          theme.glow
        )} />
      </motion.div>
    </AnimatePresence>
  );
};
