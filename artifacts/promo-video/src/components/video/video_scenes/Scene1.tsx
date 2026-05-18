import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),   // Coral line draws
      setTimeout(() => setPhase(2), 1200),  // 'AI' drops in
      setTimeout(() => setPhase(3), 1600),  // 'PrintVerse' drops in
      setTimeout(() => setPhase(4), 2800),  // Subtitle
      setTimeout(() => setPhase(5), 5500),  // Exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center"
      {...sceneTransitions.fadeBlur}
    >
      <div className="relative z-10 flex flex-col items-center justify-center w-full">
        {/* Animated line */}
        <motion.div 
          className="h-[2px] bg-[var(--color-primary)] mb-8"
          initial={{ width: 0, opacity: 0 }}
          animate={phase >= 1 ? { width: '30vw', opacity: 1 } : { width: 0, opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />

        <div className="flex items-center overflow-hidden">
          <motion.h1 
            className="text-[8vw] font-bold text-white leading-none tracking-tight font-display"
            initial={{ y: '100%', opacity: 0 }}
            animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            AI
          </motion.h1>
          <motion.h1 
            className="text-[8vw] font-bold text-[var(--color-primary)] leading-none tracking-tight font-display"
            initial={{ y: '-100%', opacity: 0 }}
            animate={phase >= 3 ? { y: 0, opacity: 1 } : { y: '-100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            PrintVerse
          </motion.h1>
        </div>

        <motion.p 
          className="text-[2vw] text-[var(--color-text-secondary)] mt-8 font-body font-light tracking-wide uppercase"
          initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
          animate={phase >= 4 ? { opacity: 1, filter: 'blur(0px)', y: 0 } : { opacity: 0, filter: 'blur(10px)', y: 20 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >
          The Future of On-Demand Creation
        </motion.p>
      </div>

      {/* Floating accent particles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-[var(--color-primary)] opacity-20"
          style={{
            width: Math.random() * 20 + 5 + 'px',
            height: Math.random() * 20 + 5 + 'px',
            left: Math.random() * 100 + 'vw',
            top: Math.random() * 100 + 'vh',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={phase >= 1 ? {
            scale: [0, 1, 0.5, 1],
            opacity: [0, 0.4, 0.1, 0.3],
            y: [0, -100, -200],
          } : { scale: 0, opacity: 0 }}
          transition={{ duration: 8 + Math.random() * 5, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </motion.div>
  );
}
