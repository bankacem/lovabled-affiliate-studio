import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

export const SCENE_DURATIONS: Record<string, number> = {
  open: 7000,
  store: 9000,
  blog: 9500,
  mobile: 8500,
  close: 11000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  open: Scene1,
  store: Scene2,
  blog: Scene3,
  mobile: Scene4,
  close: Scene5,
};

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentScene, currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[var(--color-bg-dark)]">
      {/* Persistent background layer */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Glow left */}
        <motion.div
          className="absolute w-[80vw] h-[80vw] rounded-full opacity-10 blur-[100px]"
          style={{ background: 'radial-gradient(circle, var(--color-primary), transparent 70%)' }}
          animate={{
            x: ['-20vw', '10vw', '-10vw', '-40vw', '-20vw'][sceneIndex],
            y: ['-20vh', '40vh', '-10vh', '10vh', '-20vh'][sceneIndex],
            scale: [1, 1.2, 0.8, 1.1, 1][sceneIndex],
          }}
          transition={{ duration: 3, ease: 'easeInOut' }}
        />

        {/* Glow right */}
        <motion.div
          className="absolute w-[60vw] h-[60vw] rounded-full opacity-[0.05] blur-[80px]"
          style={{ background: 'radial-gradient(circle, #FFFFFF, transparent 70%)' }}
          animate={{
            x: ['50vw', '70vw', '40vw', '60vw', '50vw'][sceneIndex],
            y: ['60vh', '20vh', '80vh', '40vh', '60vh'][sceneIndex],
          }}
          transition={{ duration: 4, ease: 'easeInOut' }}
        />

        {/* Ambient noise texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\\"0 0 200 200\\" xmlns=\\"http://www.w3.org/2000/svg\\"%3E%3Cfilter id=\\"noiseFilter\\"%3E%3CfeTurbulence type=\\"fractalNoise\\" baseFrequency=\\"0.85\\" numOctaves=\\"3\\" stitchTiles=\\"stitch\\"/%3E%3C/filter%3E%3Crect width=\\"100%25\\" height=\\"100%25\\" filter=\\"url(%23noiseFilter)\\"/%3E%3C/svg%3E")',
          }}
        />
      </div>

      {/* Persistent midground accents */}
      <motion.div
        className="absolute h-[1px] bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent"
        animate={{
          left: ['0%', '-50%', '10%', '-20%', '0%'][sceneIndex],
          width: ['100%', '200%', '80%', '150%', '100%'][sceneIndex],
          top: ['50%', '20%', '85%', '30%', '50%'][sceneIndex],
          opacity: sceneIndex === 0 ? 0 : 0.3,
        }}
        transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
      />

      <AnimatePresence mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>
    </div>
  );
}
