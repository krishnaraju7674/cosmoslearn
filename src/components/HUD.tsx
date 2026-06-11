import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import { planets } from '@/utils/planetData';
import Dashboard from '@/features/dashboard/Dashboard';

function SearchIcon() { return <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>; }
function GridIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>; }
function CompareIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>; }
function SettingsIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>; }
function KeyboardIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>; }

export default function HUD() {
            const {
    settings, tour, compare, setViewMode, setQuality, setExperienceLevel,
    toggleSubtitles, toggleOrbitTrails, toggleLabels, toggleConstellations,
    setTimeSpeed, setCurrentPlanet, selectPlanet, setShowPanel, explorePlanet,
    startTour, setShowCompare, updateAudio, applySettingsPreset,
    showSettings, showDashboard, toggleSettings, toggleDashboard: toggleDashboardStore,
    selectedPlanet,
  } = useAppStore();

  const [showPlanetNav, setShowPlanetNav] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlanets = planets.filter(p =>
    p.id !== 'sun' && p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Top HUD Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="pointer-events-auto flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cosmic-neon via-cosmic-purple to-cosmic-pink flex items-center justify-center shadow-lg shadow-cosmic-neon/20">
              <span className="text-sm drop-shadow">🚀</span>
            </div>
            <span className="text-sm font-bold font-display bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent hidden sm:block tracking-wide">
              CosmosLearn
            </span>
          </div>

          {/* Center Controls */}
          <div className="pointer-events-auto flex items-center gap-1.5 glass rounded-2xl p-1 shadow-lg">
            {(['explore', 'tour', 'quiz'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => mode === 'tour' ? startTour() : setViewMode(mode)}
                className={`px-4 py-1.5 rounded-xl text-[10px] uppercase tracking-wider font-semibold transition-all duration-300 ${
                  (mode === 'tour' ? tour.active : settings.viewMode === mode)
                    ? 'bg-cosmic-neon/20 text-cosmic-neon border border-cosmic-neon/30 shadow-inner'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                }`}
                aria-label={`${mode === 'explore' ? 'Explore' : mode === 'tour' ? 'Start guided tour' : 'Open quiz'} mode`}
                aria-pressed={mode === 'tour' ? tour.active : settings.viewMode === mode}
              >
                {mode === 'explore' ? 'Explore' : mode === 'tour' ? 'Tour' : 'Quiz'}
              </button>
            ))}
          </div>

          {/* Right Actions */}
          <div className="pointer-events-auto flex items-center gap-1.5">
            {/* Planet Quick Nav with Visual Grid */}
            <div className="relative">
              <button onClick={() => { setShowPlanetNav(!showPlanetNav); setSearchQuery(''); }} className="btn-icon" title="Find a planet" aria-label="Find a planet" aria-expanded={showPlanetNav}>
                <GridIcon />
              </button>

              <AnimatePresence>
                {showPlanetNav && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="absolute top-full right-0 mt-2 glass-strong rounded-2xl p-4 w-72 shadow-2xl border border-cosmic-neon/10"
                  >
                    {/* Search */}
                    <div className="flex items-center gap-2 mb-3 px-2 py-1.5 glass rounded-xl">
                      <SearchIcon />
                      <input
                        type="text"
                        placeholder="Search planets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent text-xs text-white/80 placeholder-white/20 outline-none w-full font-mono"
                        autoFocus
                      />
                    </div>

                    {/* Planets Visual Grid */}
                    <div className="max-h-64 overflow-y-auto -mx-1 px-1 space-y-2">
                      {filteredPlanets.length === 0 ? (
                        <p className="text-[10px] text-white/20 text-center py-4 font-mono">No planets found</p>
                      ) : (
                        <div className="grid grid-cols-4 gap-2">
                          {filteredPlanets.map((planet) => {
                            const maxSize = Math.max(...planets.filter(p => p.id !== 'sun').map(p => p.size));
                            const circleSize = Math.max(20, (planet.size / maxSize) * 48);
                            return (
                              <button
                                key={planet.id}
                                onClick={() => {
                                  selectPlanet(planet);
                                  explorePlanet(planet.id);
                                  setShowPanel(true);
                                  setShowPlanetNav(false);
                                }}
                                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/10 transition-all group"
                                title={`${planet.name} — ${planet.type}`}
                              >
                                <div
                                  className="rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                                  style={{
                                    width: circleSize,
                                    height: circleSize,
                                    backgroundColor: planet.color,
                                    boxShadow: `0 0 12px ${planet.color}60`,
                                  }}
                                >
                                  <span className="text-[8px] text-white font-bold drop-shadow-lg" style={{ fontSize: Math.max(6, circleSize * 0.3) }}>
                                    {planet.name.slice(0, 3).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-[9px] text-white/60 group-hover:text-white/90 transition-colors text-center leading-tight">
                                  {planet.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Quick filter chips */}
                    <div className="flex gap-1.5 mt-3 pt-2 border-t border-white/5">
                      {['Terrestrial', 'Gas giant', 'Ice giant', 'Dwarf planet'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setSearchQuery(type)}
                          className={`px-2 py-1 rounded-lg text-[8px] font-mono uppercase tracking-wider transition-all ${
                            searchQuery === type ? 'bg-cosmic-neon/20 text-cosmic-neon border border-cosmic-neon/30' : 'text-white/30 hover:text-white/60 border border-transparent'
                          }`}
                        >
                          {type === 'Terrestrial' ? '🌍' : type === 'Gas giant' ? '🟠' : type === 'Ice giant' ? '❄️' : '🪨'} {type.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Time Speed */}
            <div className="hidden sm:flex items-center gap-1 glass rounded-xl px-2 py-1.5">
              <button onClick={() => setTimeSpeed(Math.max(0.1, settings.timeSpeed - 0.5))} className="text-white/30 hover:text-white/70 text-xs px-1 transition-colors">−</button>
              <span className="text-[10px] font-mono text-cosmic-neon min-w-[36px] text-center font-bold drop-shadow-sm">{settings.timeSpeed.toFixed(1)}x</span>
              <button onClick={() => setTimeSpeed(Math.min(10, settings.timeSpeed + 0.5))} className="text-white/30 hover:text-white/70 text-xs px-1 transition-colors">+</button>
            </div>

            {/* Compare */}
            <button onClick={() => setShowCompare(!compare.showCompare)} className="btn-icon" title="Compare Planets" aria-label="Compare planets side by side"><CompareIcon /></button>

            {/* Dashboard */}
            <button onClick={() => toggleDashboardStore()} className="btn-icon" title="Dashboard" aria-label="Open dashboard"><GridIcon /></button>

            {/* Keyboard Shortcuts */}
            <button onClick={() => setShowShortcuts(!showShortcuts)} className="btn-icon" title="Keyboard shortcuts" aria-label="Keyboard shortcuts"><KeyboardIcon /></button>

            {/* Settings */}
            <button onClick={() => toggleSettings()} className="btn-icon" title="Settings" aria-label="Open settings"><SettingsIcon /></button>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowShortcuts(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative glass-strong rounded-2xl p-6 max-w-sm w-full border border-white/10 shadow-2xl"
            >
              <h3 className="text-sm font-bold font-display text-gradient mb-4">Keyboard Shortcuts</h3>
              <div className="space-y-2.5">
                {[
                  { keys: 'Space', action: 'Pause/Resume tour' },
                  { keys: '← →', action: 'Navigate tour planets' },
                  { keys: 'Esc', action: 'Close panel / Exit tour' },
                  { keys: 'C', action: 'Toggle compare mode' },
                  { keys: 'D', action: 'Toggle dashboard' },
                  { keys: 'S', action: 'Toggle settings' },
                  { keys: 'T', action: 'Start guided tour' },
                  { keys: '1-9', action: 'Quick-select planet' },
                  { keys: 'Double-click', action: 'Reset camera view' },
                  { keys: 'Shift+?', action: 'Toggle shortcuts help' },
                ].map((shortcut) => (
                  <div key={shortcut.keys} className="flex items-center justify-between">
                    <kbd className="px-2 py-0.5 glass rounded-lg text-[10px] font-mono text-cosmic-neon min-w-[56px] text-center">{shortcut.keys}</kbd>
                    <span className="text-xs text-white/50">{shortcut.action}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowShortcuts(false)} className="mt-4 w-full btn-secondary text-[10px] py-2">Got it</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 right-2 sm:right-4 z-50 glass-strong rounded-2xl p-5 w-[calc(100vw-16px)] sm:w-72 max-h-[70vh] overflow-y-auto space-y-4 shadow-2xl border border-cosmic-neon/10"
          >
            <h3 className="text-sm font-bold font-display text-gradient-blue">Settings</h3>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-white/30">Presets</label>
              <div className="flex gap-1">
                {(['performance', 'balanced', 'quality'] as const).map((p) => (
                  <button key={p} onClick={() => applySettingsPreset(p)}
                    className="flex-1 py-1.5 rounded-lg text-[10px] uppercase font-semibold glass text-white/40 hover:text-white/70 hover:border-cosmic-neon/30 transition-all"
                  >{p}</button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-white/30">Quality</label>
              <div className="flex gap-1">
                {(['ultra', 'medium', 'battery'] as const).map((q) => (
                  <button key={q} onClick={() => setQuality(q)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] uppercase font-semibold transition-all ${
                      settings.quality === q ? 'bg-cosmic-neon/20 text-cosmic-neon border border-cosmic-neon/30' : 'glass text-white/40 hover:text-white/70'
                    }`}>{q}</button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-white/30">Experience Level</label>
              <div className="flex gap-1">
                {(['beginner', 'expert'] as const).map((level) => (
                  <button key={level} onClick={() => setExperienceLevel(level)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] uppercase font-semibold transition-all ${
                      settings.experienceLevel === level ? 'bg-cosmic-purple/20 text-cosmic-purple border border-cosmic-purple/30' : 'glass text-white/40 hover:text-white/70'
                    }`}>{level}</button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-white/30">Audio</label>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Mute All</span>
                <button onClick={() => updateAudio({ isMuted: !settings.audio.isMuted })}
                  className={`w-10 h-5 rounded-full transition-all ${settings.audio.isMuted ? 'bg-white/20' : 'bg-cosmic-neon'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-all ${settings.audio.isMuted ? 'ml-0.5' : 'ml-5'}`} />
                </button>
              </div>
              {!settings.audio.isMuted && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/40">Vol</span>
                  <input type="range" min="0" max="1" step="0.1" value={settings.audio.masterVolume}
                    onChange={(e) => updateAudio({ masterVolume: parseFloat(e.target.value) })}
                    className="flex-1 h-1 accent-cosmic-neon" />
                  <span className="text-[10px] font-mono text-white/40 min-w-[24px] text-right">{Math.round(settings.audio.masterVolume * 100)}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-white/30">Display</label>
              {[
                { label: 'Subtitles', value: settings.subtitles, toggle: toggleSubtitles },
                { label: 'Orbit Trails', value: settings.showOrbitTrails, toggle: toggleOrbitTrails },
                { label: 'Labels', value: settings.showLabels, toggle: toggleLabels },
                { label: 'Constellations', value: settings.showConstellations, toggle: toggleConstellations },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-white/60">{item.label}</span>
                  <button onClick={item.toggle} className={`w-10 h-5 rounded-full transition-all ${item.value ? 'bg-cosmic-neon' : 'bg-white/20'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-all ${item.value ? 'ml-5' : 'ml-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard */}
      {showDashboard && <Dashboard />}

      {/* Stop / Reset Button */}
      {(selectedPlanet || tour.active) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => {
              selectPlanet(null);
              setShowPanel(false);
              if (tour.active) useAppStore.getState().stopTour();
              (window as any).__instantResetCamera?.();
            }}
            className="px-5 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] uppercase tracking-wider font-semibold
              hover:bg-red-500/30 hover:border-red-500/50 transition-all flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Stop
          </button>
        </div>
      )}
    </>
  );
}
