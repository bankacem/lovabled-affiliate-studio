import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),   // Text left
      setTimeout(() => setPhase(2), 1000),  // Image right
      setTimeout(() => setPhase(3), 1800),  // Image floating cards
      setTimeout(() => setPhase(4), 2600),  // Accent details
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-between px-[10vw]"
      {...sceneTransitions.pushLeft}
    >
      {/* Left side text */}
      <div className="w-[40%] z-20 flex flex-col justify-center">
        <motion.div
          className="w-12 h-1 bg-[var(--color-primary)] mb-6"
          initial={{ scaleX: 0, transformOrigin: 'left' }}
          animate={phase >= 1 ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ duration: 0.8, ease: 'circOut' }}
        />
        <motion.h2 
          className="text-[4.5vw] font-display font-bold text-white leading-[1.1] mb-6"
          initial={{ opacity: 0, x: -50 }}
          animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          Infinite<br/>
          <span className="text-[var(--color-primary)] italic">Designs</span>
        </motion.h2>
        <motion.p 
          className="text-[1.5vw] text-[var(--color-text-secondary)] font-body font-light leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          Generate stunning graphics, seamlessly mapped to apparel, mugs, and more. Your on-demand store, elevated by AI.
        </motion.p>
      </div>

      {/* Right side visual */}
      <div className="w-[50%] h-[70vh] relative z-10 flex items-center justify-center">
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-[var(--color-bg-light)] to-transparent rounded-3xl border border-white/5 shadow-2xl"
          initial={{ opacity: 0, scale: 0.9, rotateY: 15, transformPerspective: 1000 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1, rotateY: 0 } : { opacity: 0, scale: 0.9, rotateY: 15 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
        
        {/* T-Shirt Image */}
        <motion.img 
          src={`${import.meta.env.BASE_URL}images/tshirt.png`}
          className="absolute w-[120%] h-auto object-contain z-20 drop-shadow-2xl"
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1.1, y: 0 } : { opacity: 0, scale: 0.8, y: 50 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.2 }}
        />

        {/* UI Elements / Cards floating around */}
        <motion.div
          className="absolute -right-[10%] top-[20%] bg-[var(--color-bg-muted)] p-4 rounded-xl border border-white/10 shadow-xl z-30 w-48 flex items-center gap-4"
          initial={{ opacity: 0, x: 50, rotate: 5 }}
          animate={phase >= 3 ? { opacity: 1, x: 0, rotate: 5 } : { opacity: 0, x: 50, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="w-10 h-10 rounded bg-[var(--color-success)]/20 flex items-center justify-center text-[var(--color-success)] font-bold">✓</div>
          <div>
            <div className="text-white text-sm font-bold">Ready to Print</div>
            <div className="text-[var(--color-text-muted)] text-xs">High-Res 4K</div>
          </div>
        </motion.div>

        <motion.div
          className="absolute -left-[5%] bottom-[15%] bg-[var(--color-bg-muted)] p-4 rounded-xl border border-[var(--color-primary)]/30 shadow-xl z-30 w-56 flex flex-col gap-2"
          initial={{ opacity: 0, x: -50, rotate: -5 }}
          animate={phase >= 3 ? { opacity: 1, x: 0, rotate: -5 } : { opacity: 0, x: -50, rotate: -5 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
        >
          <div className="flex justify-between items-center text-white text-sm font-bold">
            <span>Premium Tee</span>
            <span className="text-[var(--color-primary)]">$24.99</span>
          </div>
          <div className="flex gap-2 mt-2">
            <div className="w-6 h-6 rounded-full bg-white border border-white/20"></div>
            <div className="w-6 h-6 rounded-full bg-black border border-white/20"></div>
            <div className="w-6 h-6 rounded-full bg-[#EA6262] border border-white/20"></div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
