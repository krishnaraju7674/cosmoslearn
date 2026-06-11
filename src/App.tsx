import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import { planets } from '@/utils/planetData';
import LoadingScreen from '@/components/LoadingScreen';
import SolarSystem from '@/features/solar/SolarSystem';
import DetailPanel from '@/features/narration/DetailPanel';
import QuizArena from '@/features/quiz/QuizArena';
import HUD from '@/components/HUD';
import GuidedTour from '@/features/tour/GuidedTour';
import PlanetCompare from '@/features/solar/PlanetCompare';
import LandingPage from '@/pages/LandingPage';
import ToastContainer from '@/components/ToastContainer';
import OnboardingTooltips from '@/components/OnboardingTooltips';
import { useAudioInit } from '@/hooks/useAudio';

const nonSunPlanets = planets.filter(p => p.id !== 'sun');
const planetKeys = nonSunPlanets.map((_, i) => String((i + 1) % 10));

export default function App() {
  const { loading, settings, selectedPlanet, showPanel, selectPlanet, setShowPanel, setViewMode, startTour, compare, tour } = useAppStore();

  useAudioInit();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape') {
        if (settings.viewMode === 'quiz') { setViewMode('explore'); return; }
        if (compare.showCompare) { useAppStore.getState().setShowCompare(false); return; }
        if (showPanel) { setShowPanel(false); selectPlanet(null); return; }
      }

      if (e.key === 'c' || e.key === 'C') {
        const s = useAppStore.getState();
        s.setShowCompare(!s.compare.showCompare);
        return;
      }
      if (e.key === 's' || e.key === 'S') {
        useAppStore.getState().toggleSettings();
        return;
      }
      if (e.key === 'd' || e.key === 'D') {
        useAppStore.getState().toggleDashboard();
        return;
      }
      if (e.key === 't' || e.key === 'T') { startTour(); return; }

      if (e.key === '?' && e.shiftKey) {
        useAppStore.setState((s) => ({ settings: { ...s.settings, showShortcuts: !s.settings.showShortcuts } }));
        return;
      }

      if (planetKeys.includes(e.key) && !selectedPlanet) {
        const idx = planetKeys.indexOf(e.key);
        const p = nonSunPlanets[idx];
        if (p) { selectPlanet(p); setShowPanel(true); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.viewMode, showPanel, compare.showCompare, tour.active, selectedPlanet]);

  return (
    <div id="main-content" className="relative w-full h-screen overflow-hidden bg-cosmic-deeper" tabIndex={-1}>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[9999]"
          >
            <LandingPage />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0"
          >
            <SolarSystem />
            <LoadingScreen />
            {settings.viewMode === 'quiz' && <QuizArena />}
            <DetailPanel />
            <GuidedTour />
            <PlanetCompare />
            <HUD />
            <ToastContainer />
            <OnboardingTooltips />
            <div aria-live="polite" aria-atomic="true" className="sr-only" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
