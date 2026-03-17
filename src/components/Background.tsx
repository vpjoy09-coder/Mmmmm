import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface BackgroundProps {
  emotion: 'happy' | 'sad' | 'angry' | 'caring' | 'surprised' | 'neutral' | 'crying' | 'laughing';
  theme: {
    bg: string;
    accent: string;
    glow: string;
    gradient: string;
    particleColor: string;
  };
}

export const Background: React.FC<BackgroundProps> = ({ emotion, theme }) => {
  // Generate random particles once
  const particles = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      size: Math.random() * 5 + 2,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 20 + Math.random() * 20,
      delay: Math.random() * 10,
      type: Math.random() > 0.5 ? 'circle' : 'star',
    }));
  }, []);

  const dust = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      size: Math.random() * 2 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 30 + Math.random() * 30,
      delay: Math.random() * 5,
    }));
  }, []);

  const getEmotionEffects = () => {
    switch (emotion) {
      case 'happy': return { 
        overlay: 'bg-pink-500/15', 
        glow: 'shadow-[0_0_100px_rgba(236,72,153,0.3)]',
        animation: { scale: [1, 1.05, 1], transition: { duration: 5, repeat: Infinity } }
      };
      case 'laughing': return { 
        overlay: 'bg-orange-500/15', 
        glow: 'shadow-[0_0_120px_rgba(249,115,22,0.4)]',
        animation: { rotate: [0, 1, -1, 0], transition: { duration: 3, repeat: Infinity } }
      };
      case 'angry': return { 
        overlay: 'bg-red-600/25', 
        glow: 'shadow-[0_0_150px_rgba(220,38,38,0.5)]',
        animation: { x: [-2, 2, -2], transition: { duration: 0.1, repeat: Infinity } }
      };
      case 'sad': return { 
        overlay: 'bg-blue-600/15', 
        glow: 'shadow-[0_0_80px_rgba(37,99,235,0.2)]',
        animation: { opacity: [0.8, 1, 0.8], transition: { duration: 8, repeat: Infinity } }
      };
      case 'crying': return { 
        overlay: 'bg-indigo-900/40', 
        glow: 'shadow-[0_0_100px_rgba(79,70,229,0.3)]',
        animation: { y: [0, 5, 0], transition: { duration: 6, repeat: Infinity } }
      };
      case 'surprised': return { 
        overlay: 'bg-yellow-400/15', 
        glow: 'shadow-[0_0_120px_rgba(250,204,21,0.4)]',
        animation: { scale: [1, 1.1, 1], transition: { duration: 0.5, repeat: 3 } }
      };
      case 'caring': return { 
        overlay: 'bg-rose-400/15', 
        glow: 'shadow-[0_0_100px_rgba(251,113,133,0.3)]',
        animation: { scale: [1, 1.02, 1], transition: { duration: 4, repeat: Infinity } }
      };
      default: return { 
        overlay: 'bg-transparent', 
        glow: '',
        animation: {}
      };
    }
  };

  const effects = getEmotionEffects();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base Wall Color with Motion */}
      <motion.div 
        animate={effects.animation}
        className={cn("absolute inset-0 transition-colors duration-2000", theme.bg)} 
      />
      
      {/* Dynamic Gradient Layer */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40 transition-all duration-2000", theme.gradient)} />

      {/* Atmospheric Glow Center */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] rounded-full blur-[120px]", theme.glow)}
      />

      {/* Room Perspective Lines */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-[20%] h-full bg-black/20 skew-y-[12deg] origin-top-left border-r border-white/5" />
        <div className="absolute top-0 right-0 w-[20%] h-full bg-black/20 -skew-y-[12deg] origin-top-right border-l border-white/5" />
      </div>

      {/* Floor with Rug */}
      <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-black/40 backdrop-blur-md border-t border-white/10 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(90deg,transparent,transparent_60px,rgba(255,255,255,0.1)_61px)]" />
        {/* Rug */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[80%] bg-rose-900/20 rounded-[120px] blur-2xl" />
        {/* Dynamic Floor Glow */}
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 5, repeat: Infinity }}
          className={cn("absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-full blur-3xl rounded-full", theme.glow)}
        />
      </div>

      {/* Window with Dynamic Light */}
      <div className="absolute top-[12%] right-[15%] w-40 h-56 bg-white/5 rounded-lg border border-white/20 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        <div className="absolute top-1/2 w-full h-[2px] bg-white/20" />
        <div className="absolute left-1/2 h-full w-[2px] bg-white/20" />
        
        {/* Light Rays that react to emotion */}
        <motion.div 
          animate={{ 
            opacity: emotion === 'happy' || emotion === 'laughing' ? [0.2, 0.4, 0.2] : [0.05, 0.15, 0.05],
            rotate: [10, 15, 10]
          }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[linear-gradient(135deg,rgba(255,255,255,0.2)_0%,transparent_60%)]" 
        />
      </div>

      {/* Shelf with Items */}
      <div className="absolute top-[35%] left-[12%] w-48 h-2 bg-white/10 rounded-full shadow-lg">
        {/* Items on shelf (abstract) */}
        <div className="absolute -top-8 left-4 w-5 h-8 bg-indigo-500/30 rounded-sm border border-white/10" />
        <div className="absolute -top-6 left-16 w-8 h-6 bg-emerald-500/30 rounded-sm border border-white/10" />
        <div className="absolute -top-10 left-32 w-6 h-10 bg-rose-500/30 rounded-sm border border-white/10" />
      </div>

      {/* Bookshelf Detail */}
      <div className="absolute bottom-[10%] right-[10%] w-32 h-48 flex flex-col space-y-1">
        <div className="w-full h-2 bg-white/5 rounded-full" />
        <div className="flex space-x-1 h-12 px-2">
          <div className="w-3 h-full bg-blue-500/20 rounded-sm" />
          <div className="w-4 h-full bg-rose-500/20 rounded-sm" />
          <div className="w-2 h-full bg-amber-500/20 rounded-sm" />
          <div className="w-3 h-full bg-emerald-500/20 rounded-sm" />
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full" />
        <div className="flex space-x-1 h-12 px-2">
          <div className="w-4 h-full bg-slate-500/20 rounded-sm" />
          <div className="w-2 h-full bg-indigo-500/20 rounded-sm" />
          <div className="w-5 h-full bg-rose-500/20 rounded-sm" />
        </div>
      </div>

      {/* Wall Clock */}
      <div className="absolute top-[15%] right-[35%] w-20 h-20 rounded-full border-2 border-white/10 bg-white/5 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="w-1 h-6 bg-white/20 rounded-full origin-bottom" 
        />
        <motion.div 
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 3600, repeat: Infinity, ease: "linear" }}
          className="absolute w-6 h-1 bg-white/20 rounded-full origin-left left-1/2" 
        />
        <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
      </div>

      {/* Picture Frame on Wall */}
      <div className="absolute top-[15%] left-[25%] w-32 h-40 bg-slate-900/40 border-4 border-slate-800 rounded-sm shadow-2xl rotate-[-2deg] overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/romantic/200/300')] bg-cover bg-center opacity-40 grayscale-[0.5]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Potted Plant in Corner */}
      <div className="absolute bottom-[10%] left-[5%] w-24 h-48 flex flex-col items-center">
        {/* Leaves */}
        <div className="relative w-full h-32">
          <motion.div 
            animate={{ 
              rotate: [-20, -18, -20],
              scale: [1, 1.02, 1]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-24 bg-emerald-800/40 rounded-full blur-[1px] origin-bottom rotate-[-20deg]" 
          />
          <motion.div 
            animate={{ 
              rotate: [20, 22, 20],
              scale: [1, 1.02, 1]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-24 bg-emerald-700/40 rounded-full blur-[1px] origin-bottom rotate-[20deg]" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.05, 1],
              y: [0, -2, 0]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-4 left-1/2 -translate-x-1/2 w-10 h-20 bg-emerald-600/40 rounded-full blur-[1px] origin-bottom" 
          />
        </div>
        {/* Pot */}
        <div className="w-16 h-16 bg-stone-800 rounded-b-xl border-t-4 border-stone-700 shadow-xl" />
      </div>

      {/* Soft Lamp Glow */}
      <div className="absolute top-[40%] right-[5%] w-64 h-64 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Emotion Overlay (Immersive) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={emotion}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.4, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={cn("absolute inset-0 transition-colors duration-2000", effects.overlay, effects.glow)}
        />
      </AnimatePresence>

      {/* Floating Particles (Enhanced) */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: `${p.x}%`, y: `${p.y}%`, opacity: 0, scale: 0 }}
          animate={{ 
            y: [`${p.y}%`, `${p.y - 20}%`],
            x: [`${p.x}%`, `${p.x + (Math.random() - 0.5) * 10}%`],
            opacity: [0, 0.4, 0],
            scale: [0, 1.2, 0],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: emotion === 'angry' ? p.duration / 4 : (emotion === 'happy' ? p.duration / 2 : p.duration), 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: p.delay
          }}
          className={cn(
            "absolute shadow-lg",
            p.type === 'circle' ? 'rounded-full' : 'clip-path-star'
          )}
          style={{ 
            width: p.size, 
            height: p.size, 
            backgroundColor: theme.particleColor,
            filter: `blur(${p.size / 3}px) brightness(1.8)`
          }}
        />
      ))}

      {/* Subtle Dust Layer */}
      {dust.map((d) => (
        <motion.div
          key={`dust-${d.id}`}
          initial={{ x: `${d.x}%`, y: `${d.y}%`, opacity: 0 }}
          animate={{ 
            y: [`${d.y}%`, `${d.y - 10}%`],
            opacity: [0, 0.2, 0],
          }}
          transition={{ 
            duration: d.duration, 
            repeat: Infinity, 
            ease: "linear",
            delay: d.delay
          }}
          className="absolute bg-white rounded-full blur-[2px]"
          style={{ width: d.size, height: d.size }}
        />
      ))}

      {/* Vignette & Grain */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
    </div>
  );
};
