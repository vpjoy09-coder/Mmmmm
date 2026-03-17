import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Outfit } from '../types';

interface AvatarProps {
  isSpeaking: boolean;
  audioLevel: number; // 0 to 1
  emotion: 'happy' | 'sad' | 'angry' | 'caring' | 'surprised' | 'neutral' | 'crying' | 'laughing';
  isUserPresent: boolean;
  isKissing?: boolean;
  isSinging?: boolean;
  isDancing?: boolean;
  isComingForward?: boolean;
  outfit?: Outfit;
  theme: {
    bg: string;
    accent: string;
    glow: string;
    border: string;
    gradient: string;
    particleColor: string;
    avatarBase: string;
  };
}

export const Avatar: React.FC<AvatarProps> = ({
  isSpeaking,
  audioLevel,
  emotion,
  isUserPresent,
  isKissing = false,
  isSinging = false,
  isDancing = false,
  isComingForward = false,
  outfit = 'casual',
  theme,
}) => {
  const [blink, setBlink] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [headRotation, setHeadRotation] = useState(0);
  const [containerWidth, setContainerWidth] = useState(256);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive scaling factor
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const scale = containerWidth / 320; // Base scale on 320px (md size)

  // Lifelike random movements (blinking, eye darting, head tilting)
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 4000 + Math.random() * 3000);

    return () => clearInterval(blinkInterval);
  }, []);

  useEffect(() => {
    const movementInterval = setInterval(() => {
      if (isUserPresent) {
        setEyeOffset({
          x: (Math.random() - 0.5) * 4,
          y: (Math.random() - 0.5) * 2
        });
      } else {
        if (Math.random() > 0.4) {
          setEyeOffset({
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 5
          });
        } else {
          setEyeOffset({ x: 0, y: 0 });
        }
      }

      if (Math.random() > 0.7) {
        setHeadRotation((Math.random() - 0.5) * 6);
      }
    }, 2000 + Math.random() * 2000);

    return () => clearInterval(movementInterval);
  }, [isUserPresent]);

  const getEmotionRingColor = () => {
    switch (emotion) {
      case 'happy': return 'bg-pink-400';
      case 'laughing': return 'bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)]';
      case 'caring': return 'bg-rose-400';
      case 'sad': return 'bg-blue-400';
      case 'crying': return 'bg-indigo-500';
      case 'angry': return 'bg-red-500';
      case 'surprised': return 'bg-yellow-400';
      default: return 'bg-pink-300';
    }
  };

  const getEmotionColors = () => {
    switch (emotion) {
      case 'happy': return 'from-pink-300 via-rose-300 to-orange-300';
      case 'laughing': return 'from-orange-300 via-yellow-300 to-pink-300';
      case 'caring': return 'from-rose-300 via-pink-300 to-fuchsia-300';
      case 'sad': return 'from-blue-300 via-indigo-300 to-violet-300';
      case 'crying': return 'from-blue-400 via-indigo-500 to-slate-600';
      case 'angry': return 'from-red-400 via-rose-500 to-orange-500';
      case 'surprised': return 'from-yellow-300 via-amber-300 to-orange-300';
      default: return 'from-pink-200 via-rose-200 to-pink-300';
    }
  };

  const getEyeStyles = (isRight: boolean) => {
    const baseSize = 46 * scale; // Slightly larger eyes
    const blinkHeight = 2 * scale;
    const base = { height: blink ? blinkHeight : baseSize, width: baseSize, borderRadius: '999px' };
    switch (emotion) {
      case 'happy': return { ...base, height: blink ? blinkHeight : 38 * scale, y: 2 * scale };
      case 'laughing': return { ...base, height: blink ? blinkHeight : 32 * scale, rotate: isRight ? 10 : -10, y: -1 * scale };
      case 'angry': return { ...base, rotate: isRight ? 12 : -12, scaleY: 0.9 };
      case 'sad': return { ...base, rotate: isRight ? -8 : 8, y: 3 * scale };
      case 'crying': return { ...base, rotate: isRight ? -12 : 12, height: blink ? blinkHeight : 38 * scale };
      case 'surprised': return { ...base, height: blink ? blinkHeight : 56 * scale, width: 56 * scale };
      default: return base;
    }
  };

  // Smoother, more organic mouth movement - removed jitter for a cleaner look
  const mouthHeight = (isSpeaking 
    ? (emotion === 'laughing' ? 36 + (audioLevel * 32) : 12 + (audioLevel * 24)) 
    : (emotion === 'laughing' ? 24 : 6)) * scale;
  const mouthWidth = (isSpeaking 
    ? (emotion === 'happy' || emotion === 'laughing' ? 48 + (audioLevel * 16) : 24 + (audioLevel * 16)) 
    : (emotion === 'happy' || emotion === 'laughing' ? 48 : 24)) * scale;

  return (
    <motion.div 
      ref={containerRef}
      animate={{
        scale: 1,
        z: 0,
        y: [0, -4, 0], // Subtle breathing/posture shift
      }}
      transition={{ 
        y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
        type: "spring", 
        stiffness: 100, 
        damping: 15 
      }}
      className="relative w-[70vw] h-[70vw] sm:w-[60vw] sm:h-[60vw] md:w-80 md:h-80 lg:w-96 lg:h-96 xl:w-[448px] xl:h-[448px] flex items-center justify-center perspective-1000 max-w-[512px] max-h-[512px] min-w-[200px] min-h-[200px]"
    >
      {/* Background Glow */}
      <motion.div
        animate={{
          scale: isSpeaking ? [1, 1.1, 1] : [1, 1.05, 1],
          opacity: isSpeaking ? [0.5, 0.8, 0.5] : [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "absolute inset-0 rounded-full blur-[60px] bg-gradient-to-tr transition-colors duration-1000",
          getEmotionColors()
        )}
      />

      {/* Emotion Indicator Ring (Pulsating Halo) */}
      <motion.div
        animate={{
          scale: [1, 1.04, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className={cn(
          "absolute inset-[-8px] rounded-full blur-[12px] transition-colors duration-1000 z-0",
          getEmotionRingColor()
        )}
      />

      {/* Main Avatar Body with Head Tilt and Breathing */}
      <motion.div
        animate={{ 
          y: isDancing ? [0, -40, 0] : [0, -1.5, 0], 
          x: isDancing ? [0, 10, -10, 0] : [0, 0.5, -0.5, 0],
          scale: isDancing ? [1, 0.9, 1.1, 1] : [1, 1.005, 1],
          rotateZ: isDancing ? [-8, 8, -8, 8, 0] : headRotation,
          rotateX: isSpeaking ? [0, 1.5, 0] : 0
        }}
        transition={{ 
          y: { duration: isDancing ? 0.4 : 3, repeat: Infinity, ease: "easeInOut" }, 
          x: { duration: isDancing ? 0.8 : 7, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: isDancing ? 0.4 : 6, repeat: Infinity, ease: "easeInOut" },
          rotateZ: { duration: isDancing ? 0.8 : 1.5, repeat: isDancing ? Infinity : 0, type: isDancing ? "tween" : "spring", stiffness: 80, damping: 12 },
          rotateX: { duration: 0.2, repeat: Infinity, ease: "easeInOut" }
        }}
        className={cn(
          "relative w-full h-full rounded-full border-4 flex flex-col items-center justify-center overflow-hidden transition-all duration-700",
          theme.avatarBase,
          isUserPresent ? cn("shadow-[0_0_40px_rgba(0,0,0,0.2)]", theme.border.replace('border-', 'border-opacity-50 border-')) : "border-slate-100 shadow-[0_0_20px_rgba(0,0,0,0.1)]"
        )}
      >
        {/* Soft inner shadow for 3D effect */}
        <div className={cn("absolute inset-0 bg-radial-gradient from-transparent via-white/10 to-black/5 pointer-events-none")} />

        {/* Outfit Layers */}
        <AnimatePresence mode="wait">
          {outfit === 'formal' && (
            <motion.div
              key="formal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 w-full h-1/3 bg-gradient-to-b from-slate-700 to-slate-900 flex justify-center z-10"
            >
              <div className="w-1/2 h-full bg-white clip-path-v-neck shadow-inner" />
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-2 w-5 h-5 bg-rose-600 rotate-45 shadow-sm" 
              /> {/* Bowtie */}
              <div className="absolute top-0 left-1/4 w-1 h-full bg-black/10" />
              <div className="absolute top-0 right-1/4 w-1 h-full bg-black/10" />
            </motion.div>
          )}
          {outfit === 'sporty' && (
            <motion.div
              key="sporty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 w-full h-1/4 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 z-10"
            >
              <div className="absolute top-0 w-full h-3 bg-white/40 backdrop-blur-sm flex justify-around items-center px-4">
                <div className="w-1 h-1 bg-white rounded-full" />
                <div className="w-1 h-1 bg-white rounded-full" />
                <div className="w-1 h-1 bg-white rounded-full" />
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-bold text-white/50 tracking-tighter uppercase">Active</div>
            </motion.div>
          )}
          {outfit === 'party' && (
            <motion.div
              key="party"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 z-10 pointer-events-none"
            >
              <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-violet-600 to-fuchsia-500 opacity-80" />
              {/* Glitter effect */}
              {Array.from({ length: 24 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0.5, 1.5, 0.5],
                    y: [0, -20, 0]
                  }}
                  transition={{ duration: 1 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                  className="absolute w-1.5 h-1.5 bg-yellow-300 rounded-full blur-[0.5px] shadow-[0_0_8px_rgba(253,224,71,0.8)]"
                  style={{ 
                    top: `${Math.random() * 100}%`, 
                    left: `${Math.random() * 100}%` 
                  }}
                />
              ))}
            </motion.div>
          )}
          {outfit === 'romantic' && (
            <motion.div
              key="romantic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-0 w-full h-1/3 bg-gradient-to-b from-rose-300/60 to-rose-500/80 backdrop-blur-md z-10 flex items-center justify-center"
            >
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-2xl"
              >
                ❤️
              </motion.div>
            </motion.div>
          )}
          {outfit === 'traditional' && (
            <motion.div
              key="traditional"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 z-10 border-[16px] border-amber-500/30 rounded-full shadow-[inset_0_0_20px_rgba(245,158,11,0.2)]"
            >
              <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-amber-600 to-orange-500" />
              <div className="absolute inset-4 border border-amber-400/20 rounded-full border-dashed" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Face Container */}
        <motion.div 
          animate={{ scale: [1, 1.01, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-full h-full flex flex-col items-center justify-center z-20 mt-4"
        >
          
          {/* Eyebrows (Micro-expressions) */}
          <div className="absolute top-[28%] w-full flex justify-around px-[18%] z-30">
            <motion.div
              animate={{
                y: emotion === 'surprised' ? -8 : (emotion === 'angry' ? 3 : (emotion === 'sad' ? -1 : 0)),
                rotate: emotion === 'angry' ? 12 : (emotion === 'sad' ? -8 : 0),
                opacity: 0.4
              }}
              className="w-10 h-1 bg-slate-800 rounded-full"
            />
            <motion.div
              animate={{
                y: emotion === 'surprised' ? -8 : (emotion === 'angry' ? 3 : (emotion === 'sad' ? -1 : 0)),
                rotate: emotion === 'angry' ? -12 : (emotion === 'sad' ? 8 : 0),
                opacity: 0.4
              }}
              className="w-10 h-1 bg-slate-800 rounded-full"
            />
          </div>

          {/* Eyes & Blush */}
          <div className="relative w-full flex flex-col items-center">
            <motion.div 
              animate={{ 
                x: eyeOffset.x * scale, 
                y: (eyeOffset.y + (isSpeaking ? -1 : 0)) * scale,
                scale: isSpeaking ? 1.02 : 1
              }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="flex justify-around w-full px-[15%] relative z-10"
            >
              {/* Left Eye */}
              <motion.div
                animate={getEyeStyles(false)}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="bg-slate-800 relative overflow-hidden"
              >
                <motion.div animate={{ opacity: blink ? 0 : 1 }} className="absolute top-[15%] left-[15%] w-[35%] h-[35%] bg-white rounded-full" />
                <motion.div animate={{ opacity: blink ? 0 : 1 }} className="absolute top-[60%] left-[60%] w-[15%] h-[15%] bg-white rounded-full" />
              </motion.div>

              {/* Right Eye */}
              <motion.div
                animate={getEyeStyles(true)}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="bg-slate-800 relative overflow-hidden"
              >
                <motion.div animate={{ opacity: blink ? 0 : 1 }} className="absolute top-[15%] left-[15%] w-[35%] h-[35%] bg-white rounded-full" />
                <motion.div animate={{ opacity: blink ? 0 : 1 }} className="absolute top-[60%] left-[60%] w-[15%] h-[15%] bg-white rounded-full" />
              </motion.div>
            </motion.div>

            {/* Blush */}
            <div className="flex justify-around w-full px-[12%] mt-1 opacity-70">
              <motion.div 
                animate={{ 
                  opacity: isKissing ? 1 : (emotion === 'happy' || emotion === 'caring' ? 0.9 : 0.5), 
                  scale: isKissing ? 1.6 : (emotion === 'happy' ? 1.3 : 1.1),
                  backgroundColor: isKissing ? '#f43f5e' : '#f472b6' // rose-500 vs pink-400
                }}
                style={{ width: 44 * scale, height: 18 * scale }}
                className="rounded-full blur-[8px]"
              />
              <motion.div 
                animate={{ 
                  opacity: isKissing ? 1 : (emotion === 'happy' || emotion === 'caring' ? 0.9 : 0.5), 
                  scale: isKissing ? 1.6 : (emotion === 'happy' ? 1.3 : 1.1),
                  backgroundColor: isKissing ? '#f43f5e' : '#f472b6'
                }}
                style={{ width: 44 * scale, height: 18 * scale }}
                className="rounded-full blur-[8px]"
              />
            </div>
          </div>

          {/* Mouth with Lipstick */}
          <div className="mt-4 flex items-center justify-center relative">
            {/* Lipstick Base */}
            <motion.div
              animate={{
                height: mouthHeight,
                width: mouthWidth,
                borderRadius: '999px',
                y: 0,
                scaleX: 1,
              }}
              transition={{ type: "spring", stiffness: 600, damping: 20 }}
              className={cn(
                "transition-colors duration-500",
                outfit === 'romantic' || outfit === 'party' ? "bg-red-700 shadow-[0_0_8px_rgba(185,28,28,0.5)]" : "bg-rose-400"
              )}
            />
            {/* Glossy Highlight */}
            {(outfit === 'romantic' || outfit === 'party') && (
              <motion.div 
                animate={{ width: mouthWidth * 0.6, height: 2 * scale }}
                className="absolute top-1 bg-white/30 rounded-full blur-[1px]" 
              />
            )}
          </div>

          {/* Microphone for Singing */}
          <AnimatePresence>
            {isSinging && (
              <motion.div
                initial={{ y: 200, opacity: 0, rotate: 20 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: 200, opacity: 0, rotate: 20 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="absolute bottom-[-10%] z-50 flex flex-col items-center"
              >
                {/* Mic Head */}
                <div className="w-16 h-20 bg-slate-400 rounded-2xl border-4 border-slate-500 relative overflow-hidden shadow-lg">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,black_1px,transparent_1px)] bg-[size:4px_4px]" />
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
                </div>
                {/* Mic Body/Handle */}
                <div className="w-8 h-40 bg-slate-800 rounded-b-lg shadow-xl -mt-2 relative">
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-8 bg-slate-700 rounded-sm" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tears */}
          {emotion === 'crying' && (
            <div className="absolute top-[25%] w-full flex justify-around px-[20%] pointer-events-none">
              <motion.div 
                animate={{ y: [0, 30 * scale], opacity: [0, 1, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                style={{ width: 8 * scale, height: 16 * scale }}
                className="bg-blue-300/80 rounded-full blur-[1px]"
              />
              <motion.div 
                animate={{ y: [0, 30 * scale], opacity: [0, 1, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }}
                style={{ width: 8 * scale, height: 16 * scale }}
                className="bg-blue-300/80 rounded-full blur-[1px]"
              />
            </div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
