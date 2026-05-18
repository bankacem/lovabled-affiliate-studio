import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),   // Logo morph
      setTimeout(() => setPhase(2), 1500),  // Tagline
      setTimeout(() => setPhase(3), 2500),  // URL / Final
      setTimeout(() => setPhase(4), 8500),  // Exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-bg-dark)]"
      {...sceneTransitions.morphExpand}
    >
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Brand Icon / Logo Mark */}
        <motion.div
          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[#FF8F8F] mb-8 shadow-[0_0_50px_rgba(234,98,98,0.5)] flex items-center justify-center"
          initial={{ scale: 0, rotate: -45 }}
          animate={phase >= 1 ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -45 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </motion.div>

        <motion.h1 
          className="text-[6vw] font-bold text-white leading-none tracking-tight font-display flex gap-2"
        >
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            AI
          </motion.span>
          <motion.span
            className="text-[var(--color-primary)]"
            initial={{ opacity: 0, y: 30 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            PrintVerse
          </motion.span>
        </motion.h1>

        <motion.p 
          className="text-[2vw] text-white mt-6 font-body font-light tracking-wide"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={phase >= 2 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 1 }}
        >
          AI-Powered Design. <span className="text-[var(--color-primary)] font-medium">Infinite Possibilities.</span>
        </motion.p>

        <motion.div
          className="mt-16 px-8 py-3 rounded-full border border-white/20 bg-white/5 backdrop-blur-md"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-[1.2vw] font-mono text-[var(--color-text-secondary)]">aiprintverse.com</span>
        </motion.div>
      </div>

      {/* Sweeping light effect */}
      {phase >= 2 && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent w-[200%] h-full skew-x-12"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 2.5, ease: 'easeInOut', delay: 1 }}
        />
      )}
    </motion.div>
  );
}
