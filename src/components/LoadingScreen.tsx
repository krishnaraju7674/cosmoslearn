import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import { audioEngine } from '@/services/audioEngine';
import { planets } from '@/utils/planetData';

const loadingMessages = [
  'Launching CosmosLearn...',
  'Warming up the Sun...',
  'Aligning planetary orbits...',
  'Calibrating star charts...',
  'Positioning satellites...',
  'Ready for launch!',
];

const tips = [
  'The Sun contains 99.86% of all mass in our solar system.',
  'A day on Venus is longer than its year!',
  'Saturn is so light it would float in water.',
  "Jupiter's Great Red Spot storm is larger than Earth.",
  'Neptune has winds up to 2,100 km/h!',
  'Mars has the tallest mountain in the solar system.',
  'Uranus rotates on its side at 98 degrees.',
  'There are more stars in the universe than grains of sand on Earth.',
];

function AnimatedGalaxy() {
  const stars = useMemo(() => {
    const arr: { x: number; y: number; size: number; speed: number; delay: number; color: string }[] = [];
    for (let i = 0; i < 100; i++) {
      arr.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 3,
        speed: 0.3 + Math.random() * 1,
        delay: Math.random() * 5,
        color: ['#4466ff', '#ff6644', '#ffffff', '#ffdd44', '#8844ff'][Math.floor(Math.random() * 5)],
      });
    }
    return arr;
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: star.size,
            height: star.size,
            backgroundColor: star.color,
            boxShadow: `0 0 ${star.size * 2}px ${star.color}`,
          }}
          initial={{ x: `${star.x}vw`, y: `${star.y}vh`, opacity: 0 }}
          animate={{
            opacity: [0, 0.8, 0.2, 0.9, 0.1],
            y: [`${star.y}vh`, `${star.y - 5}vh`, `${star.y + 3}vh`, `${star.y - 2}vh`, `${star.y}vh`],
          }}
          transition={{
            duration: 3 + star.speed * 2,
            repeat: Infinity,
            delay: star.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

function OrbitalRing({ size, color, delay = 0, duration = 8 }: { size: number; color: string; delay?: number; duration?: number }) {
  return (
    <motion.div
      className="absolute rounded-full border"
      style={{
        width: size,
        height: size,
        borderColor: color,
        borderWidth: '0.5px',
        opacity: 0.15,
      }}
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear', delay }}
    >
      <motion.div
        className="absolute w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color, top: '-3px', left: '50%', boxShadow: `0 0 4px ${color}` }}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}

export default function LoadingScreen() {
  const { loading, loadingProgress, loadingMessage, setLoading, setLoadingProgress, setLoadingMessage } = useAppStore();
  const [dots, setDots] = useState('');
  const [showCTA, setShowCTA] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);

    const progressInterval = setInterval(() => {
      setLoadingProgress(Math.min(useAppStore.getState().loadingProgress + (
        useAppStore.getState().loadingProgress < 30 ? Math.random() * 18 + 5 :
        useAppStore.getState().loadingProgress < 60 ? Math.random() * 7 + 3 :
        useAppStore.getState().loadingProgress < 85 ? Math.random() * 3 + 1 :
        Math.random() * 1.5 + 0.3
      ), 100));
    }, 250);

    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 3500);

    return () => {
      clearInterval(dotInterval);
      clearInterval(progressInterval);
      clearInterval(tipInterval);
    };
  }, []);

  useEffect(() => {
    if (loadingProgress >= 100) {
      setShowCTA(true);
      audioEngine.playLaunchWhoosh();
    }
  }, [loadingProgress]);

  useEffect(() => {
    const idx = Math.floor((loadingProgress / 100) * loadingMessages.length);
    setLoadingMessage(loadingMessages[Math.min(idx, loadingMessages.length - 1)]);
  }, [loadingProgress]);

  const handleStart = () => {
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-gradient-to-b from-[#000011] via-[#0a0022] to-[#000011] flex flex-col items-center justify-center"
        >
          <AnimatedGalaxy />

          {/* Orbital Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-72 h-72 flex items-center justify-center">
              <OrbitalRing size={280} color="#00d4ff" duration={12} />
              <OrbitalRing size={220} color="#7b2ff7" duration={16} delay={2} />
              <OrbitalRing size={160} color="#ff2d95" duration={20} delay={4} />
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center space-y-6 px-6 max-w-md w-full">
            {/* Logo */}
            <motion.div
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="text-center"
            >
              <motion.div
                className="w-20 h-20 mx-auto mb-4 rounded-full relative flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cosmic-neon via-cosmic-purple to-cosmic-pink animate-pulse-slow" />
                <div className="absolute inset-1 rounded-full bg-[#000011] flex items-center justify-center">
                  <motion.span
                    className="text-3xl"
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    🚀
                  </motion.span>
                </div>
              </motion.div>

              <h1 className="text-4xl font-bold font-display bg-gradient-to-r from-cosmic-neon via-cosmic-purple to-cosmic-pink bg-clip-text text-transparent">
                CosmosLearn
              </h1>
              <p className="text-[11px] text-white/30 mt-2 font-light tracking-[0.3em] uppercase">
                AI-Powered Space Explorer
              </p>
            </motion.div>

            {/* Progress */}
            <div className="w-full space-y-2">
              <div className="h-1 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    width: `${loadingProgress}%`,
                    background: 'linear-gradient(90deg, #00d4ff, #7b2ff7, #ff2d95)',
                  }}
                  layout
                />
              </div>
              <div className="flex justify-between text-[10px] text-white/25 font-mono tracking-wider">
                <span className="flex items-center gap-1">
                  {showCTA ? (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-cosmic-neon">
                      ● System Ready
                    </motion.span>
                  ) : (
                    <>{loadingMessage}{dots}</>
                  )}
                </span>
                {!showCTA && <span>{Math.round(loadingProgress)}%</span>}
              </div>
            </div>

            {/* Tip or CTA */}
            {!showCTA ? (
              <motion.p
                key={tipIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-[10px] text-white/20 text-center italic max-w-xs leading-relaxed"
              >
                ✦ {tips[tipIndex]}
              </motion.p>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: 'spring', damping: 15 }}
                className="pt-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(0,212,255,0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStart}
                  className="px-10 py-3.5 rounded-2xl bg-gradient-to-r from-cosmic-neon to-cosmic-purple text-white font-bold text-sm tracking-wider uppercase relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Begin Your Journey
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </motion.button>
              </motion.div>
            )}
          </div>

          {/* Progressive planet reveal */}
          <div className="absolute bottom-20 flex items-center gap-1.5">
            {planets.map((p, i) => {
              const threshold = (i + 1) / planets.length * 100;
              const revealed = loadingProgress >= threshold;
              return (
                <motion.div
                  key={p.id}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: p.color }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={revealed ? { scale: 1, opacity: 0.8 } : { scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  title={p.name}
                />
              );
            })}
          </div>

          {/* Bottom credit */}
          {!showCTA && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="absolute bottom-8 text-[8px] text-white/10 tracking-[0.2em] uppercase font-mono"
            >
              Loading Stellar Data...
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
