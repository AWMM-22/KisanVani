import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Fill the progress bar over 2.5s
    const startTime = Date.now();
    const duration = 2500;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setLoadingProgress(progress);
      if (elapsed >= duration) {
        clearInterval(interval);
      }
    }, 30);

    // Complete the splash sequence after 3 seconds
    const completeTimeout = setTimeout(() => {
      onComplete();
    }, 3200);

    return () => {
      clearInterval(interval);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  return (
    <motion.div
      id="splash-container"
      className="absolute inset-0 z-50 flex flex-col items-center justify-between py-12 px-6 text-white select-none phone-screen"
      style={{ backgroundColor: "#0C190C" }}
      initial={{ y: 0 }}
      exit={{ y: "-100%", transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] } }}
    >
      {/* 1. Header Emblem Spacer */}
      <div className="w-full flex justify-center pt-2">
        <span className="text-[10px] tracking-widest text-emerald-400 font-mono font-bold uppercase bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/55 shadow-sm">
          ✨ KISANVAANI DIGITAL PLATFORM ✨
        </span>
      </div>

      {/* 2. Unified Hero Graphic: Sun Backdrop + Rotating Rays + Farmer Circular Image */}
      <div id="unified-hero-section" className="relative flex flex-col items-center justify-center my-auto py-4">
        
        {/* Dynamic Sun Ray Backdrop */}
        <div className="absolute w-72 h-72 flex items-center justify-center pointer-events-none">
          {/* Glowing Sun Radial Core */}
          <motion.div
            className="absolute w-48 h-48 rounded-full bg-radial from-amber-400/35 via-yellow-600/10 to-transparent blur-xl"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0.8 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />

          {/* Rotating Sophisticated Geometric Sun Rays */}
          <motion.div
            className="absolute w-64 h-64 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-64 bg-gradient-to-t from-transparent via-amber-400/35 to-transparent"
                style={{ transform: `rotate(${i * 30}deg)` }}
              />
            ))}
          </motion.div>
        </div>

        {/* Elegant Abstract Rising Sun Disk (offset slightly upwards) */}
        <motion.div
          className="absolute -top-8 w-36 h-36 rounded-full bg-gradient-to-b from-amber-300 via-amber-500 to-yellow-600 border border-yellow-300/40 shadow-[0_0_30px_rgba(245,158,11,0.4)]"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        {/* Farmer Hero Circular Frame */}
        <motion.div
          className="relative z-10 w-44 h-44 rounded-full overflow-hidden border-4 border-[#244b24] shadow-[0_12px_24px_rgba(0,0,0,0.8)] bg-emerald-950"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          <img
            id="farmer-hero-image"
            src="/src/assets/images/farmer_sunrise_gold_1781698766693.jpg"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          {/* Subtle vignette layer inside photo frame */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-emerald-950/80 to-transparent" />
        </motion.div>
      </div>

      {/* 3. Cohesive Typographic Content (completely non-overlapping) */}
      <div id="splash-branding-content" className="w-full text-center py-2 flex flex-col items-center">
        {/* Fully connected bold Hindi word - Devanagari upper shirorekha perfectly connected */}
        <motion.h1 
          className="text-6xl font-[900] tracking-normal mb-1.5 text-yellow-400 drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)]"
          style={{ fontFamily: '"Inter", sans-serif' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          किसानवाणी
        </motion.h1>

        {/* Brand Accent */}
        <motion.div
          className="text-[11px] tracking-[0.25em] text-emerald-400 font-mono font-bold uppercase mb-3.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          K I S A N V A A N I &nbsp; A I
        </motion.div>

        {/* Tagline showing App purpose */}
        <motion.p
          className="text-base font-semibold text-emerald-100 tracking-wide bg-emerald-950/40 px-4 py-1 rounded-full border border-emerald-800/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.8 }}
        >
          आपका खेत, आपकी आवाज़
        </motion.p>
      </div>

      {/* 4. Progressive Loading Bar Section */}
      <div id="splash-loading-bar-wrapper" className="w-full max-w-xs text-center pt-2">
        <div className="w-full bg-emerald-950/80 h-1.5 rounded-full overflow-hidden border border-emerald-900/60 shadow-inner">
          <div
            className="bg-gradient-to-r from-emerald-400 via-green-400 to-yellow-400 h-full rounded-full transition-all duration-30s ease-out"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
        <p className="text-[11px] text-emerald-400 font-mono mt-2 tracking-widest font-semibold flex justify-center items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping" />
          {Math.floor(loadingProgress)}% शुरू हो रहा है...
        </p>
      </div>
    </motion.div>
  );
}
