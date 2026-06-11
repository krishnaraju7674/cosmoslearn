import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useToastStore } from './useToastStore';
import {
  AppSettings,
  UserProgress,
  AudioState,
  QualityMode,
  ViewMode,
  ExperienceLevel,
  PlanetData,
  Badge,
  TourState,
  CompareState,
} from '@/utils/types';
import { planets, planetMap, badges } from '@/utils/planetData';

interface AppStore {
  settings: AppSettings;
  progress: UserProgress;
  selectedPlanet: PlanetData | null;
  narration: string;
  isNarrationStreaming: boolean;
  currentQuiz: any[];
  currentQuizIndex: number;
  quizScore: number;
  quizAnswers: Record<number, string>;
  showPanel: boolean;
  loading: boolean;
  loadingProgress: number;
  loadingMessage: string;
  tour: TourState;
  compare: CompareState;
  showSettings: boolean;
  showDashboard: boolean;

  // Settings actions
  setQuality: (mode: QualityMode) => void;
  setViewMode: (mode: ViewMode) => void;
  setExperienceLevel: (level: ExperienceLevel) => void;
  setCurrentPlanet: (id: string | null) => void;
  updateAudio: (partial: Partial<AudioState>) => void;
  toggleSubtitles: () => void;
  toggleReducedMotion: () => void;
  toggleColorblindMode: () => void;
  toggleOrbitTrails: () => void;
  toggleLabels: () => void;
  toggleConstellations: () => void;
  setTimeSpeed: (speed: number) => void;
  applySettingsPreset: (preset: 'performance' | 'balanced' | 'quality') => void;

  // Tour actions
  startTour: () => void;
  stopTour: () => void;
  nextTourPlanet: () => void;
  prevTourPlanet: () => void;
  toggleTourPause: () => void;

  // Compare actions
  setShowCompare: (show: boolean) => void;
  setComparePlanets: (planets: [string, string]) => void;

  // Planet actions
  selectPlanet: (planet: PlanetData | null) => void;
  explorePlanet: (planetId: string) => void;
  setShowPanel: (show: boolean) => void;

  // Narration actions
  setNarration: (text: string) => void;
  setNarrationStreaming: (streaming: boolean) => void;

  // Quiz actions
  setCurrentQuiz: (quiz: any[]) => void;
  setCurrentQuizIndex: (index: number) => void;
  setQuizScore: (score: number) => void;
  setQuizAnswer: (index: number, answer: string) => void;
  completeQuiz: (planetId: string, accuracy: number) => void;
  resetQuiz: () => void;

  // Progress actions
  addXP: (amount: number) => void;
  addBadge: (badgeId: string) => void;
  checkBadges: () => string[];
  simulateStreak: () => void;
  updateLearningTime: (minutes: number) => void;

  // Loading actions
  setLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setLoadingMessage: (message: string) => void;
  toggleSettings: () => void;
  toggleDashboard: () => void;
}

const defaultTour: TourState = { active: false, paused: false, planetIndex: 0 };
const defaultCompare: CompareState = { showCompare: false, comparePlanets: ['earth', 'mars'] };

const defaultSettings: AppSettings = {
  quality: 'medium',
  viewMode: 'explore',
  experienceLevel: 'beginner',
  audio: {
    masterVolume: 0.7,
    sfxVolume: 0.8,
    musicVolume: 0.5,
    narrationVolume: 0.8,
    isMuted: false,
  },
  subtitles: true,
  reducedMotion: false,
  colorblindMode: false,
  currentPlanet: null,
  showOrbitTrails: true,
  showLabels: true,
  showConstellations: false,
  timeSpeed: 1,
  isTyping: false,
  isNarrating: false,
};

const defaultProgress: UserProgress = {
  exploredPlanets: [],
  completedQuizzes: [],
  quizAccuracy: {},
  totalXP: 0,
  streak: 0,
  badges: [],
  strongestTopic: '',
  weakestTopic: '',
  totalLearningTime: 0,
  masteryLevels: {},
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      progress: defaultProgress,
      selectedPlanet: null,
      narration: '',
      isNarrationStreaming: false,
      currentQuiz: [],
      currentQuizIndex: 0,
      quizScore: 0,
      quizAnswers: {},
      showPanel: false,
      loading: true,
      loadingProgress: 0,
      loadingMessage: 'Launching CosmosLearn...',
      tour: defaultTour,
      compare: defaultCompare,
      showSettings: false,
      showDashboard: false,

      // Settings
      setQuality: (mode) =>
        set((s) => ({ settings: { ...s.settings, quality: mode } })),
      setViewMode: (mode) =>
        set((s) => ({ settings: { ...s.settings, viewMode: mode } })),
      setExperienceLevel: (level) =>
        set((s) => ({ settings: { ...s.settings, experienceLevel: level } })),
      setCurrentPlanet: (id) =>
        set((s) => ({ settings: { ...s.settings, currentPlanet: id } })),
      updateAudio: (partial) =>
        set((s) => ({
          settings: {
            ...s.settings,
            audio: { ...s.settings.audio, ...partial },
          },
        })),
      toggleSubtitles: () =>
        set((s) => ({
          settings: { ...s.settings, subtitles: !s.settings.subtitles },
        })),
      toggleReducedMotion: () =>
        set((s) => ({
          settings: { ...s.settings, reducedMotion: !s.settings.reducedMotion },
        })),
      toggleColorblindMode: () =>
        set((s) => ({
          settings: { ...s.settings, colorblindMode: !s.settings.colorblindMode },
        })),
      toggleOrbitTrails: () =>
        set((s) => ({
          settings: { ...s.settings, showOrbitTrails: !s.settings.showOrbitTrails },
        })),
      toggleLabels: () =>
        set((s) => ({
          settings: { ...s.settings, showLabels: !s.settings.showLabels },
        })),
      toggleConstellations: () =>
        set((s) => ({
          settings: { ...s.settings, showConstellations: !s.settings.showConstellations },
        })),
      setTimeSpeed: (speed) =>
        set((s) => ({ settings: { ...s.settings, timeSpeed: speed } })),
      applySettingsPreset: (preset) => {
        const presets = {
          performance: {
            quality: 'battery' as QualityMode,
            showOrbitTrails: false,
            showLabels: true,
            showConstellations: false,
            timeSpeed: 1,
          },
          balanced: {
            quality: 'medium' as QualityMode,
            showOrbitTrails: true,
            showLabels: true,
            showConstellations: false,
            timeSpeed: 1,
          },
          quality: {
            quality: 'ultra' as QualityMode,
            showOrbitTrails: true,
            showLabels: true,
            showConstellations: true,
            timeSpeed: 1,
          },
        };
        const p = presets[preset];
        set((s) => ({
          settings: { ...s.settings, ...p },
        }));
        useToastStore.getState().addToast({
          type: 'info',
          title: `Preset: ${preset.charAt(0).toUpperCase() + preset.slice(1)}`,
          message: preset === 'performance' ? 'Optimized for speed' : preset === 'balanced' ? 'Default settings applied' : 'Maximum visual quality enabled',
          icon: preset === 'performance' ? '⚡' : preset === 'balanced' ? '⚖️' : '🎨',
        });
      },

      // Tour
      startTour: () =>
        set((s) => ({
          settings: { ...s.settings, viewMode: 'tour' },
          tour: { active: true, paused: false, planetIndex: 0 },
          showPanel: false,
        })),
      stopTour: () =>
        set((s) => ({
          settings: { ...s.settings, viewMode: 'explore' },
          tour: { active: false, paused: false, planetIndex: 0 },
          showPanel: false,
        })),
      nextTourPlanet: () =>
        set((s) => {
          const nextIndex = s.tour.planetIndex + 1;
          const tourPlanets = planets.filter((p) => p.id !== 'sun');
          if (nextIndex >= tourPlanets.length) {
            return {
              settings: { ...s.settings, viewMode: 'explore' },
              tour: { active: false, paused: false, planetIndex: 0 },
            };
          }
          return {
            tour: { ...s.tour, planetIndex: nextIndex },
            selectedPlanet: tourPlanets[nextIndex],
          };
        }),
      prevTourPlanet: () =>
        set((s) => {
          const prevIndex = Math.max(0, s.tour.planetIndex - 1);
          const tourPlanets = planets.filter((p) => p.id !== 'sun');
          return {
            tour: { ...s.tour, planetIndex: prevIndex },
            selectedPlanet: tourPlanets[prevIndex],
          };
        }),
      toggleTourPause: () =>
        set((s) => ({
          tour: { ...s.tour, paused: !s.tour.paused },
        })),

      // Compare
      setShowCompare: (show) =>
        set((s) => ({
          compare: { ...s.compare, showCompare: show },
        })),
      setComparePlanets: (comparePlanets) =>
        set((s) => ({
          compare: { ...s.compare, comparePlanets },
        })),

      // Planet
      selectPlanet: (planet) => set({ selectedPlanet: planet }),
      explorePlanet: (planetId) => {
        const s = get();
        const isNew = !s.progress.exploredPlanets.includes(planetId);
        const explored = isNew
          ? [...s.progress.exploredPlanets, planetId]
          : s.progress.exploredPlanets;
        set({
          progress: { ...s.progress, exploredPlanets: explored },
        });
        if (isNew) {
          const planetName = planetMap.get(planetId)?.name || planetId;
          useToastStore.getState().addToast({
            type: 'info',
            title: 'New Discovery!',
            message: `You discovered ${planetName}!`,
            icon: '🪐',
          });
        }
      },
      setShowPanel: (show) => set({ showPanel: show }),

      // Narration
      setNarration: (text) => set({ narration: text }),
      setNarrationStreaming: (streaming) => set({ isNarrationStreaming: streaming }),

      // Quiz
      setCurrentQuiz: (quiz) => set({ currentQuiz: quiz }),
      setCurrentQuizIndex: (index) => set({ currentQuizIndex: index }),
      setQuizScore: (score) => set({ quizScore: score }),
      setQuizAnswer: (index, answer) =>
        set((s) => ({
          quizAnswers: { ...s.quizAnswers, [index]: answer },
        })),
      completeQuiz: (planetId, accuracy) => {
        const s = get();
        const completed = s.progress.completedQuizzes.includes(planetId)
          ? s.progress.completedQuizzes
          : [...s.progress.completedQuizzes, planetId];
        const oldAccuracy = s.progress.quizAccuracy[planetId] || 0;
        const newAccuracy = Math.max(oldAccuracy, accuracy);
        const xpGain = Math.round(accuracy * 10);
        set({
          progress: {
            ...s.progress,
            completedQuizzes: completed,
            quizAccuracy: { ...s.progress.quizAccuracy, [planetId]: newAccuracy },
            totalXP: s.progress.totalXP + xpGain,
          },
        });
        const planetName = planetMap.get(planetId)?.name || planetId;
        useToastStore.getState().addToast({
          type: 'xp',
          title: 'Quiz Complete!',
          message: `${accuracy}% on ${planetName} — earned ${xpGain} XP`,
          icon: '🧠',
        });
        if (accuracy >= 80) {
          useToastStore.getState().addToast({
            type: 'achievement',
            title: 'Mastery Unlocked!',
            message: `You mastered ${planetName} with ${accuracy}%!`,
            icon: '🌟',
            duration: 5000,
          });
        }
        if (accuracy === 100) {
          useToastStore.getState().addToast({
            type: 'achievement',
            title: 'Perfect Score!',
            message: `Flawless on ${planetName}! You're a true explorer.`,
            icon: '💯',
            duration: 5000,
          });
        }
      },
      resetQuiz: () =>
        set({
          currentQuiz: [],
          currentQuizIndex: 0,
          quizScore: 0,
          quizAnswers: {},
        }),

      // Progress
      addXP: (amount) => {
        const prevXP = get().progress.totalXP;
        const newXP = prevXP + amount;
        const prevLevel = Math.floor(prevXP / 200);
        const newLevel = Math.floor(newXP / 200);
        set((s) => ({
          progress: { ...s.progress, totalXP: newXP },
        }));
        if (newLevel > prevLevel) {
          useToastStore.getState().addToast({
            type: 'achievement',
            title: `Level ${newLevel} Reached!`,
            message: `You've reached explorer level ${newLevel}!`,
            icon: '🚀',
          });
        }
      },
      addBadge: (badgeId) => {
        const state = get();
        if (state.progress.badges.includes(badgeId)) return;
        set((s) => ({
          progress: {
            ...s.progress,
            badges: [...s.progress.badges, badgeId],
            totalXP: s.progress.totalXP + 50,
          },
        }));
        const badge = badgeId;
        useToastStore.getState().addToast({
          type: 'achievement',
          title: 'Badge Unlocked!',
          message: `You earned +50 XP for "${badge}"`,
          icon: '🏆',
          duration: 5000,
        });
      },
      checkBadges: () => {
        const state = get();
        const newBadges: string[] = [];
        const { progress } = state;

        // Check first explore
        if (progress.exploredPlanets.length >= 1 && !progress.badges.includes('first_explore')) {
          newBadges.push('first_explore');
        }
        // Check solar explorer
        if (progress.exploredPlanets.length >= 8 && !progress.badges.includes('solar_explorer')) {
          newBadges.push('solar_explorer');
        }
        // Check XP 1000
        if (progress.totalXP >= 1000 && !progress.badges.includes('xp_1000')) {
          newBadges.push('xp_1000');
        }
        // Check planet masteries
        planets.forEach((p) => {
          if (p.id === 'sun') return;
          const accuracy = progress.quizAccuracy[p.id];
          const badgeId = `${p.id}_mastery`;
          if (accuracy >= 80 && !progress.badges.includes(badgeId) && p.id in progress.quizAccuracy) {
            newBadges.push(badgeId);
          }
        });

        newBadges.forEach((id) => {
          get().addBadge(id);
        });

        return newBadges;
      },
      simulateStreak: () => {
        const s = get();
        const newStreak = s.progress.streak + 1;
        set({
          progress: { ...s.progress, streak: newStreak },
        });
        if (newStreak > 1 && newStreak % 5 === 0) {
          useToastStore.getState().addToast({
            type: 'streak',
            title: `${newStreak}-Day Streak!`,
            message: `You're on fire! Keep learning every day.`,
            icon: '🔥',
            duration: 5000,
          });
        }
      },
      updateLearningTime: (minutes) =>
        set((s) => ({
          progress: {
            ...s.progress,
            totalLearningTime: s.progress.totalLearningTime + minutes,
          },
        })),

      // Loading
      setLoading: (loading) => set({ loading }),
      setLoadingProgress: (progress) => set({ loadingProgress: progress }),
      setLoadingMessage: (message) => set({ loadingMessage: message }),
      toggleSettings: () => set((s) => ({ showSettings: !s.showSettings })),
      toggleDashboard: () => set((s) => ({ showDashboard: !s.showDashboard })),
    }),
    {
      name: 'cosmoslearn-storage',
      partialize: (state) => ({
        progress: state.progress,
        settings: state.settings,
      }),
    }
  )
);