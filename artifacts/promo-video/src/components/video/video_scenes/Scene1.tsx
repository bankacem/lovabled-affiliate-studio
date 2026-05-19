import { useState, useEffect, useRef, Component, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
// @ts-ignore — three v0.182 ships no .d.ts; types provided via r3f.d.ts + runtime
import * as THREE from 'three';

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

class R3FErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

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
    const c = coral.clone().lerp(white, Math.random() * 0.4);
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
      <pointsMaterial vertexColors size={0.028} sizeAttenuation transparent opacity={0.7} />
    </points>
  );
}

function ThreeCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.5], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true }}
      onCreated={() => {}}
    >
      <ambientLight intensity={0.4} />
      <CoralParticleSphere />
    </Canvas>
  );
}

function CSSParticleFallback({ visible }: { visible: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    const TOTAL = 320;
    const particles = Array.from({ length: TOTAL }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 1.2 + Math.random() * 1.8,
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.0003,
      alpha: 0.3 + Math.random() * 0.6,
      coral: Math.random() > 0.45,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1;
        if (p.y > 1) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x * canvas.width, p.y * canvas.height, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.coral
          ? `rgba(234,98,98,${p.alpha})`
          : `rgba(255,255,255,${p.alpha * 0.5})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: visible ? 0.7 : 0, transition: 'opacity 1.2s ease' }}
    />
  );
}

export function Scene1() {
  const [phase, setPhase] = useState(0);
  const [webglOk] = useState(() => isWebGLAvailable());

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1600),
      setTimeout(() => setPhase(4), 2000),
      setTimeout(() => setPhase(5), 3200),
      setTimeout(() => setPhase(6), 5800),
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
      {/* Particle background: Three.js/WebGL when available, CSS canvas fallback otherwise */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: phase >= 1 ? 1 : 0, transition: 'opacity 1.2s ease' }}
      >
        {webglOk ? (
          <R3FErrorBoundary fallback={<CSSParticleFallback visible={phase >= 1} />}>
            <ThreeCanvas />
          </R3FErrorBoundary>
        ) : (
          <CSSParticleFallback visible={phase >= 1} />
        )}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full">
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
