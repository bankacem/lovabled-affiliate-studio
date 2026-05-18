import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — three v0.182 ships no .d.ts; runtime types come via @react-three/fiber
import * as THREE from 'three';
import { sceneTransitions } from '@/lib/video/animations';

function CoralParticleSphere() {
  const meshRef = useRef<THREE.Points>(null);
  const PARTICLE_COUNT = 600;

  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const r = 1.6 + (Math.random() - 0.5) * 0.8;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    const coral = new THREE.Color('#EA6262');
    const white = new THREE.Color('#FFFFFF');
    const t = Math.random();
    const c = coral.clone().lerp(white, t * 0.4);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.12;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.07) * 0.18;
  });

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        vertexColors
        size={0.028}
        sizeAttenuation
        transparent
        opacity={0.7}
      />
    </points>
  );
}

function ThreeBackground({ visible }: { visible: boolean }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 1.2s ease' }}
    >
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <CoralParticleSphere />
      </Canvas>
    </div>
  );
}

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),   // Three.js sphere fades in
      setTimeout(() => setPhase(2), 900),   // Coral line draws
      setTimeout(() => setPhase(3), 1600),  // 'AI' drops in
      setTimeout(() => setPhase(4), 2000),  // 'PrintVerse' drops in
      setTimeout(() => setPhase(5), 3200),  // Subtitle
      setTimeout(() => setPhase(6), 5800),  // Begin exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
      transition={{ duration: 0.8, ease: 'circOut' }}
    >
      {/* Three.js animated particle sphere */}
      <ThreeBackground visible={phase >= 1} />

      <div className="relative z-10 flex flex-col items-center justify-center w-full">
        {/* Animated coral line */}
        <motion.div
          className="h-[2px] bg-[#EA6262] mb-8"
          initial={{ width: 0, opacity: 0 }}
          animate={phase >= 2 ? { width: '30vw', opacity: 1 } : { width: 0, opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />

        <div className="flex items-center overflow-hidden">
          <motion.h1
            className="text-[8vw] font-bold text-white leading-none tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
            initial={{ y: '100%', opacity: 0 }}
            animate={phase >= 3 ? { y: 0, opacity: 1 } : { y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            AI
          </motion.h1>
          <motion.h1
            className="text-[8vw] font-bold text-[#EA6262] leading-none tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
            initial={{ y: '-100%', opacity: 0 }}
            animate={phase >= 4 ? { y: 0, opacity: 1 } : { y: '-100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            PrintVerse
          </motion.h1>
        </div>

        <motion.p
          className="text-[1.8vw] text-white/60 mt-8 font-light tracking-widest uppercase"
          style={{ fontFamily: 'var(--font-body)' }}
          initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
          animate={
            phase >= 5
              ? { opacity: 1, filter: 'blur(0px)', y: 0 }
              : { opacity: 0, filter: 'blur(10px)', y: 20 }
          }
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >
          AI-Powered Design. Infinite Possibilities.
        </motion.p>
      </div>
    </motion.div>
  );
}
