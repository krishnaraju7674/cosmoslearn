import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '@/stores/useToastStore';

const icons: Record<string, string> = {
  achievement: '🏆',
  xp: '⭐',
  info: 'ℹ️',
  warning: '⚠️',
  streak: '🔥',
};

const gradients: Record<string, string> = {
  achievement: 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30',
  xp: 'from-cosmic-neon/20 to-blue-500/10 border-cosmic-neon/30',
  info: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30',
  warning: 'from-red-500/20 to-orange-500/10 border-red-500/30',
  streak: 'from-orange-500/20 to-red-500/10 border-orange-500/30',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" role="region" aria-label="Notifications">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            layout
            className={`pointer-events-auto glass-strong rounded-xl border px-4 py-3 min-w-[280px] max-w-[360px] shadow-2xl bg-gradient-to-r ${gradients[toast.type] || gradients.info}`}
            role="alert"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg shrink-0 mt-0.5" aria-hidden="true">
                {toast.icon || icons[toast.type] || 'ℹ️'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white tracking-wide">{toast.title}</p>
                <p className="text-xs text-white/60 mt-0.5">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
                aria-label="Dismiss notification"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
