import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import { fetchNarration, fetchQuiz } from '@/services/aiService';
import { planetMap } from '@/utils/planetData';

const maxValues: Record<string, number> = {
  'Diameter': 142984,
  'Gravity': 24.79,
  'Moons': 146,
  'Distance from Sun': 5906400000,
  'Orbital Period': 90580,
  'Temperature': 464,
};

function parseNum(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  if (value.toLowerCase().includes('million')) return num * 1_000_000;
  if (value.toLowerCase().includes('billion')) return num * 1_000_000_000;
  return num;
}

function StatBar({ label, value, max }: { label: string; value: string; max: number }) {
  const num = parseNum(value);
  const pct = max > 0 ? Math.min((num / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-white/50 uppercase tracking-wider">{label}</span>
        <span className="text-white/80 font-mono">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-cosmic-neon to-cosmic-purple"
        />
      </div>
    </div>
  );
}

function AtmosphereVisual({ composition }: { composition: string }) {
  const gases = composition.split(',').map((g) => g.trim());
  const colors = ['#3b82f6', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b', '#06b6d4'];
  return (
    <div className="glass rounded-xl p-3">
      <span className="text-[10px] uppercase tracking-widest text-white/30">Atmosphere Composition</span>
      <div className="flex flex-wrap gap-2 mt-2">
        {gases.map((gas, i) => (
          <span
            key={i}
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${colors[i % colors.length]}20`, color: colors[i % colors.length], border: `1px solid ${colors[i % colors.length]}40` }}
          >
            {gas}
          </span>
        ))}
      </div>
    </div>
  );
}

function AnimatedCounter({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center p-3 glass rounded-xl">
      <span className="text-lg font-bold text-cosmic-neon font-mono">{value}</span>
      <span className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">{label}</span>
    </div>
  );
}

function NarrationSection({ planetId }: { planetId: string }) {
  const { setNarration, narration, isNarrationStreaming, setNarrationStreaming, settings } = useAppStore();
  const [displayedText, setDisplayedText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!planetId) return;
    setDisplayedText('');
    setNarration('');
    setNarrationStreaming(true);
    let accumulated = '';
    fetchNarration(planetId, settings.experienceLevel, (chunk) => {
      accumulated += chunk;
      setNarration(accumulated);
    }).finally(() => {
      setNarrationStreaming(false);
    });
  }, [planetId]);

  useEffect(() => {
    if (!narration || isNarrationStreaming) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i <= narration.length) {
        setDisplayedText(narration.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [narration, isNarrationStreaming]);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find((v) => v.lang.startsWith('en') && v.name.includes('Female')) || voices[0];
      if (preferred) setVoice(preferred);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(displayedText || narration);
    if (voice) utterance.voice = voice;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-widest text-cosmic-neon/60">AI Guide Narration</h3>
        <div className="flex gap-2">
          <button onClick={handleSpeak} className="btn-icon">
            {isSpeaking ? (
              <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4 text-cosmic-neon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
            )}
          </button>
        </div>
      </div>
      <div className="glass rounded-xl p-4 min-h-[80px] relative">
        <p className="text-sm leading-relaxed text-white/80 font-light">
          {displayedText}
          {isNarrationStreaming && <span className="typing-cursor" />}
        </p>
        {!narration && isNarrationStreaming && (
          <div className="flex gap-1 mt-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-cosmic-neon/50 animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatsGrid({ planetId }: { planetId: string }) {
  const planet = planetMap.get(planetId);
  if (!planet) return null;

  const stats = [
    { label: 'Diameter', value: planet.diameter },
    { label: 'Gravity', value: planet.gravity },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-xs uppercase tracking-widest text-cosmic-neon/60">Key Statistics</h3>
      <div className="space-y-2">
        {stats.map((stat) => (
          <StatBar key={stat.label} label={stat.label} value={stat.value} max={maxValues[stat.label] || 100} />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
        <AnimatedCounter label="Moons" value={String(planet.moons)} />
        <AnimatedCounter label="Distance" value={planet.distanceFromSun} />
        <AnimatedCounter label="Orbit" value={planet.orbitalPeriod} />
        <AnimatedCounter label="Temperature" value={planet.temperature} />
      </div>
    </div>
  );
}

function FunFacts({ planetId }: { planetId: string }) {
  const planet = planetMap.get(planetId);
  if (!planet) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs uppercase tracking-widest text-cosmic-purple/60">Fun Facts</h3>
      {planet.funFacts.map((fact, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.2 }}
          className="flex items-start gap-3 glass rounded-xl p-3"
        >
          <span className="text-cosmic-gold text-lg shrink-0">✦</span>
          <p className="text-sm text-white/70">{fact}</p>
        </motion.div>
      ))}
    </div>
  );
}

function Missions({ planetId }: { planetId: string }) {
  const planet = planetMap.get(planetId);
  if (!planet) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs uppercase tracking-widest text-cosmic-pink/60">Exploration Missions</h3>
      <div className="glass rounded-xl p-4">
        <div className="flex flex-wrap gap-2">
          {planet.missions.map((mission, i) => (
            <span
              key={i}
              className="px-3 py-1 text-xs rounded-full bg-cosmic-neon/10 text-cosmic-neon border border-cosmic-neon/20"
            >
              {mission}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DetailPanel() {
  const {
    selectedPlanet,
    showPanel,
    setShowPanel,
    selectPlanet,
    setCurrentQuiz,
    setViewMode,
    settings,
  } = useAppStore();

  const handleClose = () => {
    setShowPanel(false);
    selectPlanet(null);
  };

  const handleQuiz = async () => {
    if (!selectedPlanet) return;
    const quiz = await fetchQuiz(selectedPlanet.id, settings.experienceLevel);
    setCurrentQuiz(quiz);
    setViewMode('quiz');
  };

  return (
    <AnimatePresence>
      {showPanel && selectedPlanet && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40 pointer-events-none"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md z-50 overflow-y-auto"
          >
            <div className="min-h-full glass-strong border-l border-cosmic-neon/20 p-4 sm:p-6 space-y-4 sm:space-y-6 scan-line">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedPlanet.color }}
                    />
                    <h2 className="text-2xl font-bold font-display text-gradient">
                      {selectedPlanet.name}
                    </h2>
                  </div>
                  <p className="text-xs text-white/40">{selectedPlanet.type}</p>
                </div>
                <button onClick={handleClose} className="btn-icon hover:bg-red-500/20 hover:text-red-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-white/60 leading-relaxed italic border-l-2 border-cosmic-neon/30 pl-4">
                {selectedPlanet.description}
              </p>

              <NarrationSection planetId={selectedPlanet.id} />
              <StatsGrid planetId={selectedPlanet.id} />

              {selectedPlanet.atmosphere && (
                <AtmosphereVisual composition={selectedPlanet.atmosphere} />
              )}

              <FunFacts planetId={selectedPlanet.id} />
              <Missions planetId={selectedPlanet.id} />

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleQuiz}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Test Your Knowledge
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
