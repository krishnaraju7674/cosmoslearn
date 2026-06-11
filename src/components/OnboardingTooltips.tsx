import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';

const tips = [
  {
    key: 'explore',
    title: 'Click Any Planet',
    message: 'Click on a planet to explore it in detail. Learn about its composition, missions, and fun facts!',
    icon: '🪐',
    position: 'bottom-center',
  },
  {
    key: 'tour',
    title: 'Guided Tour',
    message: 'Press T or click "Tour" for a narrated journey through the solar system.',
    icon: '🚀',
    position: 'bottom-center',
  },
  {
    key: 'compare',
    title: 'Compare Planets',
    message: 'Press C to compare two planets side by side with detailed statistics.',
    icon: '📊',
    position: 'bottom-center',
  },
  {
    key: 'shortcuts',
    title: 'Keyboard Shortcuts',
    message: 'Press Shift+? to view all keyboard shortcuts anytime.',
    icon: '⌨️',
    position: 'bottom-center',
  },
];

export default function OnboardingTooltips() {
  const { settings } = useAppStore();
  const [currentTip, setCurrentTip] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (settings.experienceLevel === 'expert') {
      setDismissed(true);
    }
  }, [settings.experienceLevel]);

  const handleDismiss = () => {
    if (currentTip < tips.length - 1) {
      setCurrentTip((c) => c + 1);
    } else {
      setDismissed(true);
    }
  };

  if (dismissed) return null;

  const tip = tips[currentTip];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] flex items-end justify-center pb-28 pointer-events-none"
      >
        <motion.div
          key={tip.key}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="pointer-events-auto glass-strong rounded-2xl p-5 max-w-sm mx-4 border border-cosmic-neon/20 shadow-2xl"
          role="dialog"
          aria-label="Onboarding tip"
        >
          <div className="flex items-start gap-4">
            <span className="text-3xl">{tip.icon}</span>
            <div className="flex-1">
              <h3 className="text-sm font-bold font-display text-white mb-1">{tip.title}</h3>
              <p className="text-xs text-white/60 leading-relaxed">{tip.message}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-1.5">
              {tips.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentTip ? 'bg-cosmic-neon w-3' : 'bg-white/20'}`} />
              ))}
            </div>
            <button
              onClick={handleDismiss}
              className="px-4 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-semibold
                bg-gradient-to-r from-cosmic-neon to-cosmic-purple text-white
                hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all"
            >
              {currentTip < tips.length - 1 ? 'Next Tip' : 'Got It!'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
