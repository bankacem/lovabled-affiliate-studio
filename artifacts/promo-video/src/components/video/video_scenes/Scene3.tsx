import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),   // Bg/dash reveal
      setTimeout(() => setPhase(2), 1200),  // Text reveal
      setTimeout(() => setPhase(3), 2000),  // Data points
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center"
      {...sceneTransitions.zoomThrough}
    >
      {/* Background Dashboard Image */}
      <motion.div 
        className="absolute inset-0 z-0"
        initial={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
        animate={phase >= 1 ? { opacity: 0.4, scale: 1, filter: 'blur(0px)' } : { opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
        transition={{ duration: 2, ease: 'easeOut' }}
      >
        <img 
          src={`${import.meta.env.BASE_URL}images/dashboard.png`} 
          className="w-full h-full object-cover" 
          alt="Dashboard"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-dark)] via-transparent to-[var(--color-bg-dark)]"></div>
        <div className="absolute inset-0 bg-[var(--color-bg-dark)]/50"></div>
      </motion.div>

      {/* Foreground Content */}
      <div className="relative z-10 w-full flex flex-col items-center px-[10vw]">
        <motion.div
          className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-6 py-2 rounded-full font-mono text-sm uppercase tracking-widest border border-[var(--color-primary)]/30 mb-8 backdrop-blur-md"
          initial={{ opacity: 0, y: -20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
        >
          SEO Engine
        </motion.div>

        <motion.h2 
          className="text-[5vw] font-display font-bold text-white text-center leading-[1.1] mb-6 drop-shadow-2xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          Content that <span className="italic text-[var(--color-primary)]">Ranks.</span>
        </motion.h2>

        <div className="flex gap-8 mt-12 w-full justify-center">
          {/* Data Points */}
          {[
            { label: 'Auto-Linking', value: 'Active' },
            { label: 'Traffic Boost', value: '+340%' },
            { label: 'AI Articles', value: '1,000+' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-[20vw] flex flex-col items-center text-center shadow-2xl"
              initial={{ opacity: 0, y: 40, rotateX: 30, transformPerspective: 1000 }}
              animate={phase >= 3 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 40, rotateX: 30 }}
              transition={{ type: 'spring', stiffness: 150, damping: 20, delay: i * 0.2 }}
            >
              <div className="text-[var(--color-text-secondary)] text-[1vw] font-body uppercase tracking-wider mb-2">{stat.label}</div>
              <div className="text-[2.5vw] text-white font-bold font-mono">{stat.value}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
