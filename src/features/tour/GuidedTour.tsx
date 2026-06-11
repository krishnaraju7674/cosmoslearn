import React, { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import { planets } from '@/utils/planetData';
import { fetchNarration } from '@/services/aiService';

const tourPlanets = planets.filter((p) => p.id !== 'sun');

export default function GuidedTour() {
  const { tour, nextTourPlanet, prevTourPlanet, toggleTourPause, stopTour, selectPlanet, explorePlanet, setShowPanel, setNarration, setNarrationStreaming, settings } =
    useAppStore();

  const currentPlanet = tourPlanets[tour.planetIndex];
  const [syncing, setSyncing] = useState(false);

  // Sync planet selection when tour moves
  useEffect(() => {
    if (!tour.active || !currentPlanet) return;
    selectPlanet(currentPlanet);
    explorePlanet(currentPlanet.id);
    setShowPanel(true);

    // Fetch narration for current planet
    let cancelled = false;
    let accumulated = '';
    setNarration('');
    setNarrationStreaming(true);
    setSyncing(true);
    fetchNarration(currentPlanet.id, settings.experienceLevel, (chunk) => {
      if (!cancelled) {
        accumulated += chunk;
        setNarration(accumulated);
      }
    }).finally(() => {
      if (!cancelled) {
        setNarrationStreaming(false);
        setSyncing(false);
      }
    });

    return () => { cancelled = true; };
  }, [tour.planetIndex, tour.active]);

  // Auto-advance every 12 seconds when not paused
  useEffect(() => {
    if (!tour.active || tour.paused || syncing) return;

    const interval = setInterval(() => {
      nextTourPlanet();
    }, 12000);

    return () => clearInterval(interval);
  }, [tour.active, tour.paused, tour.planetIndex, nextTourPlanet, syncing]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!tour.active) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        toggleTourPause();
      }
      if (e.code === 'ArrowRight') nextTourPlanet();
      if (e.code === 'ArrowLeft') prevTourPlanet();
      if (e.code === 'Escape') stopTour();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tour.active, nextTourPlanet, prevTourPlanet, toggleTourPause, stopTour]);

  const handlePrev = useCallback(() => {
    prevTourPlanet();
  }, [prevTourPlanet]);

  const handleNext = useCallback(() => {
    nextTourPlanet();
  }, [nextTourPlanet]);

  if (!tour.active || !currentPlanet) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3"
      >
        {/* Current planet name */}
        <motion.div
          key={currentPlanet.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <div
            className="w-4 h-4 rounded-full shadow-lg"
            style={{
              backgroundColor: currentPlanet.color,
              boxShadow: `0 0 12px ${currentPlanet.color}80`,
            }}
          />
          <span className="text-lg font-display font-bold text-white tracking-wide">
            {currentPlanet.name}
          </span>
          <span className="text-xs text-white/40 font-mono">
            {tour.planetIndex + 1}/{tourPlanets.length}
          </span>
        </motion.div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {tourPlanets.map((planet, i) => (
            <button
              key={planet.id}
              onClick={() => {
                // Jump directly to this planet index
                const diff = i - tour.planetIndex;
                if (diff > 0) {
                  for (let j = 0; j < diff; j++) nextTourPlanet();
                } else if (diff < 0) {
                  for (let j = 0; j < Math.abs(diff); j++) prevTourPlanet();
                }
              }}
              className="group relative"
              title={planet.name}
            >
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === tour.planetIndex
                    ? 'scale-150'
                    : 'opacity-40 hover:opacity-70'
                }`}
                style={{
                  backgroundColor:
                    i === tour.planetIndex ? planet.color : '#ffffff',
                  boxShadow:
                    i === tour.planetIndex
                      ? `0 0 8px ${planet.color}aa`
                      : 'none',
                }}
              />
            </button>
          ))}
        </div>

        {/* Control bar */}
        <div className="glass-strong rounded-2xl px-4 py-2.5 flex items-center gap-2">
          {/* Previous */}
          <button
            onClick={handlePrev}
            className="btn-icon"
            title="Previous planet"
          >
            <svg
              className="w-4 h-4 text-white/80"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Pause / Play */}
          <button
            onClick={toggleTourPause}
            className="btn-icon"
            title={tour.paused ? 'Resume tour' : 'Pause tour'}
          >
            {tour.paused ? (
              <svg
                className="w-4 h-4 text-cosmic-neon"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-white/80"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            )}
          </button>

          {/* Next */}
          <button
            onClick={handleNext}
            className="btn-icon"
            title="Next planet"
          >
            <svg
              className="w-4 h-4 text-white/80"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* Exit */}
          <button
            onClick={stopTour}
            className="btn-icon hover:!bg-red-500/20"
            title="Exit tour"
          >
            <svg
              className="w-4 h-4 text-white/60 hover:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Paused indicator */}
        <AnimatePresence>
          {tour.paused && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="text-[10px] uppercase tracking-widest text-cosmic-neon/60 font-mono"
            >
              Paused — Press Space to resume
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
