import { useEffect, useRef } from 'react';
import { audioEngine } from '@/services/audioEngine';
import { useAppStore } from '@/stores/useAppStore';

export function useAudioInit() {
  const initialized = useRef(false);
  const { settings } = useAppStore();

  useEffect(() => {
    const handleInteraction = async () => {
      if (initialized.current) return;
      initialized.current = true;
      await audioEngine.init();
      audioEngine.setVolume(settings.audio.masterVolume);
      audioEngine.setMuted(settings.audio.isMuted);
      await audioEngine.playAmbient();
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  useEffect(() => {
    audioEngine.setVolume(settings.audio.masterVolume);
    audioEngine.setMuted(settings.audio.isMuted);
  }, [settings.audio.masterVolume, settings.audio.isMuted]);
}

export function usePlayClick() {
  return async () => {
    await audioEngine.playClick();
  };
}

export function usePlayPlanetSelect() {
  return async (planetIndex: number) => {
    await audioEngine.playPlanetSelect(planetIndex);
  };
}

export function usePlayCorrect() {
  return async () => {
    await audioEngine.playCorrect();
  };
}

export function usePlayWrong() {
  return async () => {
    await audioEngine.playWrong();
  };
}

export function usePlayLaunchWhoosh() {
  return async () => {
    await audioEngine.playLaunchWhoosh();
  };
}
