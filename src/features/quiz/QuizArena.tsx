import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/useAppStore';
import { fetchHint } from '@/services/aiService';
import type { QuizQuestion } from '@/utils/types';
import { audioEngine } from '@/services/audioEngine';

function Timer({ duration, onTimeUp }: { duration: number; onTimeUp: () => void }) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft, onTimeUp]);

  const pct = (timeLeft / duration) * 100;

  return (
    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{
          background: timeLeft > 5 ? 'linear-gradient(90deg, #00d4ff, #7b2ff7)' : '#ff2d95',
        }}
        initial={{ width: '100%' }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: 'linear' }}
      />
    </div>
  );
}

function QuestionCard({
  question,
  index,
  total,
  onAnswer,
  selectedAnswer,
  showResult,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  onAnswer: (answer: string) => void;
  selectedAnswer?: string;
  showResult: boolean;
}) {
  const isCorrect = selectedAnswer === question.answer;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40 font-mono">
          Question {index + 1} / {total}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          question.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
          question.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {question.difficulty}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-white/90 leading-relaxed">
        {question.q}
      </h3>

      <div className="space-y-2">
        {question.options.map((option, i) => {
          const isSelected = selectedAnswer === option;
          const isCorrectOption = showResult && option === question.answer;
          const isWrong = showResult && isSelected && !isCorrectOption;

          return (
            <motion.button
              key={i}
              whileHover={!showResult ? { scale: 1.01 } : {}}
              whileTap={!showResult ? { scale: 0.99 } : {}}
              onClick={() => !showResult && onAnswer(option)}
              disabled={showResult}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                isCorrectOption
                  ? 'border-green-500 bg-green-500/10 text-green-400'
                  : isWrong
                  ? 'border-red-500 bg-red-500/10 text-red-400'
                  : isSelected
                  ? 'border-cosmic-neon bg-cosmic-neon/10 text-cosmic-neon'
                  : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-current shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm">{option}</span>
                {isCorrectOption && (
                  <svg className="w-4 h-4 ml-auto text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                )}
                {isWrong && (
                  <svg className="w-4 h-4 ml-auto text-red-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function QuizArena() {
  const {
    currentQuiz,
    currentQuizIndex,
    setCurrentQuizIndex,
    quizScore,
    setQuizScore,
    quizAnswers,
    setQuizAnswer,
    completeQuiz,
    resetQuiz,
    setViewMode,
    selectedPlanet,
    setNarration,
    checkBadges,
    progress,
  } = useAppStore();

  const [showResult, setShowResult] = useState(false);
  const [hint, setHint] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [questionResults, setQuestionResults] = useState<Record<number, boolean>>({});
  const [finished, setFinished] = useState(false);
  const [streak, setStreak] = useState(0);
  const [isTimedMode, setIsTimedMode] = useState(true);

  const question = currentQuiz[currentQuizIndex];
  const isLastQuestion = currentQuizIndex >= currentQuiz.length - 1;

  const handleAnswer = useCallback(async (answer: string) => {
    if (!question || showResult) return;

    setQuizAnswer(currentQuizIndex, answer);
    setShowResult(true);

    const isCorrect = answer === question.answer;
    setQuestionResults((r) => ({ ...r, [currentQuizIndex]: isCorrect }));

    if (isCorrect) {
      setQuizScore(quizScore + 1);
      setStreak((s) => s + 1);
      audioEngine.playCorrect();
    } else {
      setStreak(0);
      audioEngine.playWrong();
      // Fetch hint
      const hintText = await fetchHint(question.q, answer, question.answer);
      setHint(hintText);
      setShowHint(true);
    }
  }, [question, currentQuizIndex, showResult, quizScore, setQuizAnswer, setQuizScore]);

  const handleNext = () => {
    setShowResult(false);
    setShowHint(false);
    setHint('');

    if (isLastQuestion) {
      handleFinish();
    } else {
      setCurrentQuizIndex(currentQuizIndex + 1);
    }
  };

  const handleFinish = () => {
    if (!selectedPlanet) return;
    const accuracy = Math.round((quizScore / currentQuiz.length) * 100);
    completeQuiz(selectedPlanet.id, accuracy);
    const newBadges = checkBadges();
    setFinished(true);
  };

  const handleTimeUp = () => {
    if (!showResult) {
      // Auto-move to next question on time up
      if (!isLastQuestion) {
        setCurrentQuizIndex(currentQuizIndex + 1);
      } else {
        handleFinish();
      }
    }
  };

  const handleRetry = () => {
    resetQuiz();
    setShowResult(false);
    setHint('');
    setQuestionResults({});
    setFinished(false);
    setStreak(0);
  };

  const handleExit = () => {
    resetQuiz();
    setViewMode('explore');
  };

  if (finished) {
    const accuracy = Math.round((quizScore / currentQuiz.length) * 100);
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-strong rounded-2xl p-8 max-w-md w-full text-center space-y-6"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-cosmic-neon to-cosmic-purple flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>

          <h2 className="text-2xl font-bold font-display text-gradient">Quiz Complete!</h2>

          <div className="flex justify-center gap-8 py-4">
            <div>
              <div className="text-3xl font-bold text-cosmic-neon">{accuracy}%</div>
              <div className="text-xs text-white/40 mt-1">Accuracy</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cosmic-gold">{quizScore}/{currentQuiz.length}</div>
              <div className="text-xs text-white/40 mt-1">Score</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cosmic-pink">{accuracy * 10} XP</div>
              <div className="text-xs text-white/40 mt-1">Earned</div>
            </div>
          </div>

          {accuracy === 100 && (
            <div className="glass rounded-xl p-4 bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-yellow-400 text-sm">🏆 Perfect score! You're a {selectedPlanet?.name} Master!</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={handleRetry} className="btn-secondary flex-1">Retry</button>
            <button onClick={handleExit} className="btn-primary flex-1">Back to Space</button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (!currentQuiz.length || !question) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-strong rounded-2xl p-6 max-w-lg w-full space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-display text-gradient">
              {selectedPlanet?.name} Quiz
            </h2>
            <p className="text-xs text-white/40">
              {isTimedMode ? 'Timed Mode' : 'Practice Mode'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {streak > 1 && (
              <span className="text-sm text-cosmic-gold">🔥 {streak} streak</span>
            )}
            <span className="text-sm text-cosmic-neon font-mono">
              {quizScore}/{currentQuiz.length}
            </span>
            <button onClick={handleExit} className="btn-icon">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Timer */}
        {isTimedMode && !showResult && (
          <Timer duration={30} onTimeUp={handleTimeUp} />
        )}

        {/* Question */}
        <AnimatePresence mode="wait">
          <QuestionCard
            key={currentQuizIndex}
            question={question}
            index={currentQuizIndex}
            total={currentQuiz.length}
            onAnswer={handleAnswer}
            selectedAnswer={quizAnswers[currentQuizIndex]}
            showResult={showResult}
          />
        </AnimatePresence>

        {/* Hint */}
        <AnimatePresence>
          {showHint && hint && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass rounded-xl p-4 border border-yellow-500/30 bg-yellow-500/5"
            >
              <div className="flex items-start gap-2">
                <span className="text-yellow-400 text-lg shrink-0">💡</span>
                <p className="text-sm text-yellow-300/80">{hint}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fact */}
        {showResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-xl p-3 border border-cosmic-neon/30"
          >
            <p className="text-xs text-cosmic-neon/60 mb-1">📖 Did you know?</p>
            <p className="text-sm text-white/70">{question.fact}</p>
          </motion.div>
        )}

        {/* Next/Continue Button */}
        {showResult && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            className="btn-primary w-full"
          >
            {isLastQuestion ? 'See Results' : 'Next Question'}
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}