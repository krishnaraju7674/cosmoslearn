import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import { planets } from '@/utils/planetData';
import { PlanetData } from '@/utils/types';

const comparablePlanets = planets.filter((p) => p.id !== 'sun');

/** Parse a human-readable number string like "12,756 km" or "149.6 million km" into a raw number for comparison. */
function parseNumericValue(str: string): number {
  const cleaned = str.replace(/[,°]/g, '');
  // Handle "X billion km"
  if (/billion/i.test(cleaned)) {
    const match = cleaned.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) * 1_000_000_000 : 0;
  }
  // Handle "X million km"
  if (/million/i.test(cleaned)) {
    const match = cleaned.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) * 1_000_000 : 0;
  }
  // Handle ranges like "-180°C to 430°C" – average
  if (/to/i.test(cleaned)) {
    const nums = cleaned.match(/-?[\d.]+/g);
    if (nums && nums.length >= 2) {
      return (parseFloat(nums[0]) + parseFloat(nums[1])) / 2;
    }
  }
  // Handle "X.XX years"
  if (/years?/i.test(cleaned)) {
    const match = cleaned.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) * 365.25 : 0; // convert to days
  }
  // Handle "X days"
  if (/days?/i.test(cleaned)) {
    const match = cleaned.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
  }
  // Fallback: extract first number
  const match = cleaned.match(/-?[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

interface StatRow {
  label: string;
  key: keyof PlanetData;
  unit: string;
}

const statRows: StatRow[] = [
  { label: 'Diameter', key: 'diameter', unit: '' },
  { label: 'Gravity', key: 'gravity', unit: '' },
  { label: 'Moons', key: 'moons', unit: '' },
  { label: 'Distance from Sun', key: 'distanceFromSun', unit: '' },
  { label: 'Orbital Period', key: 'orbitalPeriod', unit: '' },
  { label: 'Temperature', key: 'temperature', unit: '' },
];

function CompareBar({
  valueA,
  valueB,
  colorA,
  colorB,
}: {
  valueA: number;
  valueB: number;
  colorA: string;
  colorB: string;
}) {
  const max = Math.max(Math.abs(valueA), Math.abs(valueB), 1);
  const pctA = (Math.abs(valueA) / max) * 100;
  const pctB = (Math.abs(valueB) / max) * 100;

  return (
    <div className="flex items-center gap-2 w-full">
      {/* Planet A bar - grows from right to left */}
      <div className="flex-1 flex justify-end">
        <div
          className="compare-bar h-1.5 rounded-full"
          style={{
            width: `${pctA}%`,
            backgroundColor: colorA,
            opacity: pctA >= pctB ? 1 : 0.4,
          }}
        />
      </div>
      <span className="text-[10px] text-white/30 font-mono w-6 text-center">
        vs
      </span>
      {/* Planet B bar - grows from left to right */}
      <div className="flex-1">
        <div
          className="compare-bar h-1.5 rounded-full"
          style={{
            width: `${pctB}%`,
            backgroundColor: colorB,
            opacity: pctB >= pctA ? 1 : 0.4,
          }}
        />
      </div>
    </div>
  );
}

export default function PlanetCompare() {
  const { compare, setShowCompare, setComparePlanets } =
    useAppStore();
  const { showCompare, comparePlanets } = compare;

  const planetA = useMemo(
    () =>
      comparablePlanets.find((p) => p.id === (comparePlanets?.[0] ?? 'earth')),
    [comparePlanets]
  );
  const planetB = useMemo(
    () =>
      comparablePlanets.find((p) => p.id === (comparePlanets?.[1] ?? 'mars')),
    [comparePlanets]
  );

  const handleSelect = (slot: 0 | 1, planetId: string) => {
    const current = comparePlanets ?? ['earth', 'mars'];
    const updated: [string, string] = [...current] as [string, string];
    updated[slot] = planetId;
    setComparePlanets(updated);
  };

  if (!showCompare || !planetA || !planetB) return null;

  // Max planet size for scaling the visual circles
  const maxSize = Math.max(
    ...comparablePlanets.map((p) => p.size)
  );
  const circleScale = 80; // max circle diameter in px

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={() => setShowCompare(false)}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="relative z-10 w-full max-w-2xl mx-4 glass-strong rounded-3xl p-6 overflow-y-auto max-h-[90vh]"
        >
          {/* Close button */}
          <button
            onClick={() => setShowCompare(false)}
            className="absolute top-4 right-4 btn-icon"
          >
            <svg
              className="w-4 h-4 text-white/60"
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

          {/* Title */}
          <h2 className="text-xl font-display font-bold text-gradient text-center mb-6">
            Planet Comparison
          </h2>

          {/* Two-column selectors + visual */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Planet A */}
            <div className="flex flex-col items-center gap-3">
              <select
                value={planetA.id}
                onChange={(e) => handleSelect(0, e.target.value)}
                className="glass rounded-xl px-3 py-2 text-sm text-white bg-transparent border-white/10 focus:border-cosmic-neon/50 focus:outline-none w-full"
              >
                {comparablePlanets.map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                    className="bg-cosmic-deeper text-white"
                  >
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Visual circle */}
              <div className="flex items-center justify-center h-28">
                <motion.div
                  key={planetA.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="rounded-full"
                  style={{
                    width: `${(planetA.size / maxSize) * circleScale}px`,
                    height: `${(planetA.size / maxSize) * circleScale}px`,
                    backgroundColor: planetA.color,
                    boxShadow: `0 0 24px ${planetA.color}60, inset 0 -4px 12px rgba(0,0,0,0.4)`,
                  }}
                />
              </div>

              <span className="text-sm font-semibold text-white">
                {planetA.name}
              </span>
              <span className="text-[10px] text-white/40">{planetA.type}</span>
            </div>

            {/* Planet B */}
            <div className="flex flex-col items-center gap-3">
              <select
                value={planetB.id}
                onChange={(e) => handleSelect(1, e.target.value)}
                className="glass rounded-xl px-3 py-2 text-sm text-white bg-transparent border-white/10 focus:border-cosmic-neon/50 focus:outline-none w-full"
              >
                {comparablePlanets.map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                    className="bg-cosmic-deeper text-white"
                  >
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Visual circle */}
              <div className="flex items-center justify-center h-28">
                <motion.div
                  key={planetB.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="rounded-full"
                  style={{
                    width: `${(planetB.size / maxSize) * circleScale}px`,
                    height: `${(planetB.size / maxSize) * circleScale}px`,
                    backgroundColor: planetB.color,
                    boxShadow: `0 0 24px ${planetB.color}60, inset 0 -4px 12px rgba(0,0,0,0.4)`,
                  }}
                />
              </div>

              <span className="text-sm font-semibold text-white">
                {planetB.name}
              </span>
              <span className="text-[10px] text-white/40">{planetB.type}</span>
            </div>
          </div>

          {/* Stats comparison table */}
          <div className="space-y-3">
            {statRows.map((row) => {
              const valA = planetA[row.key];
              const valB = planetB[row.key];
              const numA =
                typeof valA === 'number' ? valA : parseNumericValue(String(valA));
              const numB =
                typeof valB === 'number' ? valB : parseNumericValue(String(valB));

              return (
                <div key={row.label} className="space-y-1">
                  <div className="flex justify-between text-[10px] uppercase tracking-wider text-white/40 font-mono">
                    <span>{String(valA)}</span>
                    <span className="text-white/60">{row.label}</span>
                    <span>{String(valB)}</span>
                  </div>
                  <CompareBar
                    valueA={numA}
                    valueB={numB}
                    colorA={planetA.color}
                    colorB={planetB.color}
                  />
                </div>
              );
            })}
          </div>

          {/* Fun fact comparison */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/10">
            <div>
              <h4 className="text-[10px] uppercase tracking-wider text-white/40 mb-2 font-mono">
                Fun Fact
              </h4>
              <p className="text-xs text-white/60 leading-relaxed">
                {planetA.funFacts[0]}
              </p>
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-wider text-white/40 mb-2 font-mono">
                Fun Fact
              </h4>
              <p className="text-xs text-white/60 leading-relaxed">
                {planetB.funFacts[0]}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
