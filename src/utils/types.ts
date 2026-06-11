export interface PlanetData {
  id: string;
  name: string;
  type: string;
  diameter: string;
  gravity: string;
  moons: number;
  distanceFromSun: string;
  orbitalPeriod: string;
  atmosphere: string;
  temperature: string;
  color: string;
  emissive: string;
  size: number;
  orbitRadius: number;
  orbitalSpeed: number;
  axialTilt: number;
  rotationSpeed: number;
  funFacts: string[];
  missions: string[];
  hasRing: boolean;
  hasClouds: boolean;
  hasAtmosphere: boolean;
  hasMoon: boolean;
  description: string;
  textureMap: string;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: string;
  fact: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface NarrationCache {
  [key: string]: {
    text: string;
    timestamp: number;
  };
}

export type QualityMode = 'ultra' | 'medium' | 'battery';
export type ViewMode = 'explore' | 'tour' | 'quiz';
export type ExperienceLevel = 'beginner' | 'expert';

export interface AudioState {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  narrationVolume: number;
  isMuted: boolean;
}

export interface UserProgress {
  exploredPlanets: string[];
  completedQuizzes: string[];
  quizAccuracy: Record<string, number>;
  totalXP: number;
  streak: number;
  badges: string[];
  strongestTopic: string;
  weakestTopic: string;
  totalLearningTime: number;
  masteryLevels: Record<string, number>;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}

export interface TourState {
  active: boolean;
  paused: boolean;
  planetIndex: number;
}

export interface CompareState {
  showCompare: boolean;
  comparePlanets: [string, string];
}

export interface AppSettings {
  quality: QualityMode;
  viewMode: ViewMode;
  experienceLevel: ExperienceLevel;
  audio: AudioState;
  subtitles: boolean;
  reducedMotion: boolean;
  colorblindMode: boolean;
  currentPlanet: string | null;
  showOrbitTrails: boolean;
  showLabels: boolean;
  showConstellations: boolean;
  timeSpeed: number;
  isTyping: boolean;
  isNarrating: boolean;
  showShortcuts?: boolean;
}