import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),   // Image up
      setTimeout(() => setPhase(2), 1000),  // Text reveal
      setTimeout(() => setPhase(3), 1600),  // Accents
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-between px-[10vw]"
      {...sceneTransitions.wipe}
    >
      {/* Left side visual */}
      <div className="w-[45%] h-[90vh] relative z-10 flex items-center justify-center">
        <motion.div
          className="absolute inset-0 bg-[var(--color-primary)]/5 rounded-full blur-[80px]"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
          transition={{ duration: 2, ease: 'easeOut' }}
        />
        
        {/* Phone Image */}
        <motion.img 
          src={`${import.meta.env.BASE_URL}images/mobile.png`}
          className="absolute w-auto h-[110%] object-contain z-20 drop-shadow-2xl object-bottom"
          style={{ bottom: '-10%' }}
          initial={{ opacity: 0, y: 100, rotate: -5 }}
          animate={phase >= 1 ? { opacity: 1, y: 0, rotate: 0 } : { opacity: 0, y: 100, rotate: -5 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        />
      </div>

      {/* Right side text */}
      <div className="w-[45%] z-20 flex flex-col justify-center">
        <motion.div
          className="flex items-center gap-4 mb-6"
          initial={{ opacity: 0, x: 30 }}
          animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-[1.2vw] font-mono text-[var(--color-primary)] uppercase tracking-widest">Mobile Companion</span>
        </motion.div>

        <motion.h2 
          className="text-[4.5vw] font-display font-bold text-white leading-[1.1] mb-6"
          initial={{ opacity: 0, x: 30 }}
          animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          Run your empire <br/>
          <span className="italic text-[var(--color-text-secondary)]">from anywhere.</span>
        </motion.h2>

        <motion.p 
          className="text-[1.5vw] text-[var(--color-text-muted)] font-body font-light leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Monitor sales, generate new designs on the fly, and optimize your blog content while on the move. Full power, pocket-sized.
        </motion.p>
      </div>
    </motion.div>
  );
}
