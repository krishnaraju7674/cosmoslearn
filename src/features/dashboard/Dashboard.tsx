import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import { planets, badges } from '@/utils/planetData';
import { planetMap } from '@/utils/planetData';

// ─── Helpers ─────────────────────────────────────────────────────
function getLevel(xp: number): number {
  return Math.floor(xp / 200) + 1;
}

function getLevelProgress(xp: number): number {
  return ((xp % 200) / 200) * 100;
}

function getLevelTitle(level: number): string {
  if (level >= 50) return 'Cosmic Overlord';
  if (level >= 30) return 'Star Lord';
  if (level >= 20) return 'Galaxy Navigator';
  if (level >= 15) return 'Solar Pioneer';
  if (level >= 10) return 'Space Explorer';
  if (level >= 5) return 'Astronomy Student';
  return 'Stargazer';
}

// ─── Radial Progress ─────────────────────────────────────────────
function RadialProgress({ value, size = 100, strokeWidth = 6, color = '#00d4ff' }: {
  value: number; size?: number; strokeWidth?: number; color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="radial-progress-ring">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        className="transition-all duration-1000 ease-out" />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fill="white" fontSize="1.5em" fontWeight="bold" fontFamily="Space Grotesk">
        {Math.round(value)}%
      </text>
    </svg>
  );
}

// ─── Badge Gallery ───────────────────────────────────────────────
function BadgeGallery() {
  const { progress } = useAppStore();
  const unlockedIds = progress.badges;
  return (
    <div className="space-y-3">
      <h3 className="text-xs uppercase tracking-widest text-cosmic-gold/60">Badges & Achievements</h3>
      <div className="grid grid-cols-4 gap-2">
        {badges.slice(0, 12).map((badge) => {
          const unlocked = unlockedIds.includes(badge.id);
          return (
            <motion.div key={badge.id} whileHover={{ scale: 1.1 }}
              className={`relative flex flex-col items-center p-2 rounded-xl ${unlocked ? 'glass border-cosmic-gold/30' : 'glass opacity-30'}`}
              title={badge.description}
            >
              <span className="text-2xl">{badge.icon}</span>
              <span className="text-[8px] text-center mt-1 text-white/60">{badge.name}</span>
              {unlocked && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-cosmic-gold rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Planet Progress ─────────────────────────────────────────────
function PlanetProgress() {
  const { progress, selectPlanet, explorePlanet, setShowPanel } = useAppStore();
  return (
    <div className="space-y-3">
      <h3 className="text-xs uppercase tracking-widest text-cosmic-neon/60">Planet Exploration</h3>
      <div className="grid grid-cols-2 gap-2">
        {planets.filter(p => p.id !== 'sun').map((planet) => {
          const explored = progress.exploredPlanets.includes(planet.id);
          const accuracy = progress.quizAccuracy[planet.id] || 0;
          const mastered = accuracy >= 80;
          return (
            <motion.button
              key={planet.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                selectPlanet(planet);
                explorePlanet(planet.id);
                setShowPanel(true);
              }}
              className={`w-full text-left glass rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all ${
                mastered ? 'border-cosmic-gold/30' : explored ? 'border-cosmic-neon/20' : ''
              }`}
            >
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: planet.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white/80">{planet.name}</span>
                  {explored && (
                    <span className={`text-[10px] ${mastered ? 'text-cosmic-gold' : 'text-cosmic-neon'}`}>
                      {mastered ? '★ Mastered' : '✓ Explored'}
                    </span>
                  )}
                </div>
                {explored && (
                  <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${accuracy}%`, background: `linear-gradient(90deg, ${planet.color}, #00d4ff)` }} />
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Streak Calendar ─────────────────────────────────────────────
function StreakCalendar() {
  const { progress } = useAppStore();
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  // Simulate a 7-day view based on streak
  const streakDays = Math.min(progress.streak, 7);
  return (
    <div className="space-y-2">
      <h3 className="text-xs uppercase tracking-widest text-orange-400/60">Learning Streak</h3>
      <div className="glass rounded-xl p-3">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-2xl">🔥</span>
          <div>
            <span className="text-lg font-bold text-white font-mono">{progress.streak}</span>
            <span className="text-xs text-white/40 ml-1">day streak</span>
          </div>
        </div>
        <div className="flex gap-1.5">
          {days.map((day, i) => {
            const active = i < streakDays;
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full h-8 rounded-lg transition-all duration-300 ${
                  active
                    ? 'bg-gradient-to-b from-orange-500 to-red-500 shadow-[0_0_8px_rgba(255,100,0,0.4)]'
                    : 'bg-white/5'
                }`} />
                <span className={`text-[8px] font-mono ${active ? 'text-orange-400' : 'text-white/20'}`}>
                  {day.slice(0, 2)}
                </span>
              </div>
            );
          })}
        </div>
        {progress.streak === 0 && (
          <p className="text-[10px] text-white/30 text-center mt-2">Complete a quiz to start your streak!</p>
        )}
      </div>
    </div>
  );
}

// ─── Level Progress ─────────────────────────────────────────────
function LevelProgress() {
  const { progress } = useAppStore();
  const level = getLevel(progress.totalXP);
  const progressPct = getLevelProgress(progress.totalXP);
  const title = getLevelTitle(level);
  const nextLevelXP = (level) * 200;
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🚀</span>
            <span className="text-lg font-bold font-display text-white">Level {level}</span>
          </div>
          <span className="text-xs text-cosmic-neon/60 font-mono">{title}</span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-cosmic-gold font-mono">{progress.totalXP}</div>
          <div className="text-[8px] text-white/30 uppercase tracking-wider">Total XP</div>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-[10px] text-white/40 mb-1">
          <span>Progress to Level {level + 1}</span>
          <span className="font-mono">{progress.totalXP % 200} / 200 XP</span>
        </div>
        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-cosmic-neon via-cosmic-purple to-cosmic-pink"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────
export default function Dashboard() {
  const { progress, setViewMode } = useAppStore();
  const completionPct = Math.round((progress.exploredPlanets.length / 8) * 100);
  const avgAccuracy = Object.values(progress.quizAccuracy).length
    ? Math.round(Object.values(progress.quizAccuracy).reduce((a, b) => a + b, 0) / Object.values(progress.quizAccuracy).length)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-24 right-4 z-40 max-w-sm w-full max-h-[75vh] overflow-y-auto"
    >
      <div className="glass-strong rounded-2xl p-5 space-y-5 border border-cosmic-neon/20 scan-line">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-display text-gradient-blue">Dashboard</h2>
            <p className="text-[10px] text-white/40">Space Explorer Profile</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cosmic-gold to-yellow-600 flex items-center justify-center">
            <span className="text-lg">🚀</span>
          </div>
        </div>

        {/* Level */}
        <LevelProgress />

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass rounded-xl p-3 text-center">
            <RadialProgress value={completionPct} size={60} strokeWidth={4} color="#00d4ff" />
            <p className="text-[8px] uppercase tracking-wider text-white/40 mt-1">Explored</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <RadialProgress value={avgAccuracy} size={60} strokeWidth={4} color="#7b2ff7" />
            <p className="text-[8px] uppercase tracking-wider text-white/40 mt-1">Accuracy</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-cosmic-pink font-mono">{progress.streak}</div>
            <div className="text-[10px] text-white/40 mt-1">🔥 Streak</div>
          </div>
        </div>

        {/* Streak Calendar */}
        <StreakCalendar />

        {/* Planet Progress */}
        <PlanetProgress />

        {/* Badges */}
        <BadgeGallery />

        {/* Quick Actions */}
        <div className="flex gap-2">
          <button onClick={() => setViewMode('explore')} className="btn-secondary flex-1 text-[10px] py-2">
            Explore Mode
          </button>
          <button onClick={() => setViewMode('tour')} className="btn-secondary flex-1 text-[10px] py-2">
            Guided Tour
          </button>
        </div>
      </div>
    </motion.div>
  );
}
