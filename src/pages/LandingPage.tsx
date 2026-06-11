import React, { useRef } from 'react'
import { motion } from 'framer-motion'
import TunnelHero from '@/components/ui/tunnel-hero'
import RotatingEarth from '@/components/ui/wireframe-dotted-globe'
import StarfieldParticles from '@/components/ui/starfield-particles'
import { useAppStore } from '@/stores/useAppStore'

const features = [
  {
    title: 'Immersive 3D Solar System',
    desc: 'Explore photorealistic planets with real-time orbits, textured surfaces, and atmospheric effects powered by Three.js.',
    icon: '🪐',
  },
  {
    title: 'AI-Powered Narration',
    desc: 'Learn through AI-generated narrations adapted to your experience level, from beginner to expert.',
    icon: '🤖',
  },
  {
    title: 'Interactive Quizzes',
    desc: 'Test your knowledge with AI-generated quizzes after exploring each planet.',
    icon: '🧠',
  },
  {
    title: 'Guided Tours',
    desc: 'Take curated tours through the solar system with narrated stops at each planet.',
    icon: '🚀',
  },
  {
    title: 'Planet Comparison',
    desc: 'Compare planets side by side with detailed statistics and visualizations.',
    icon: '📊',
  },
  {
    title: 'Audio Soundscape',
    desc: 'Immerse yourself in an ambient soundscape that adapts to your journey through space.',
    icon: '🎵',
  },
]

export default function LandingPage() {
  const setLoading = useAppStore((s) => s.setLoading)
  const exploreRef = useRef<HTMLDivElement>(null)

  const handleStart = () => {
    setLoading(false)
  }

  return (
    <div className="bg-black min-h-screen">
      <StarfieldParticles />
      {/* Hero Section */}
      <section id="hero">
        <TunnelHero onStart={handleStart} />
      </section>

      {/* About Section */}
      <section id="about" className="relative z-10 py-24 px-4 bg-gradient-to-b from-black via-[#050510] to-black">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold font-display bg-gradient-to-r from-cosmic-neon via-cosmic-purple to-cosmic-pink bg-clip-text text-transparent mb-4">
              Explore the Cosmos
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              CosmosLearn combines cutting-edge 3D visualization with AI to create an unparalleled space learning experience.
            </p>
          </motion.div>

          {/* Globe + Features Grid */}
          <div className="grid md:grid-cols-2 gap-8 items-center mb-20">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="order-2 md:order-1"
            >
              <div className="space-y-4">
                {features.slice(0, 3).map((f, i) => (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 }}
                    viewport={{ once: true }}
                    className="glass rounded-2xl p-4 border border-white/5 hover:border-cosmic-neon/20 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-2xl">{f.icon}</span>
                      <div>
                        <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
                        <p className="text-xs text-white/50">{f.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="order-1 md:order-2 flex justify-center"
            >
              <div className="w-full max-w-md">
                <RotatingEarth />
              </div>
            </motion.div>
          </div>

          {/* More Features */}
          <div className="grid md:grid-cols-3 gap-6">
            {features.slice(3).map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="glass rounded-2xl p-6 border border-white/5 hover:border-cosmic-neon/20 transition-all"
              >
                <span className="text-3xl mb-3 block">{f.icon}</span>
                <h3 className="text-sm font-bold text-white mb-2">{f.title}</h3>
                <p className="text-xs text-white/50">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="explore" className="relative z-10 py-24 px-4 bg-gradient-to-b from-black to-[#050510]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold font-display text-gradient mb-6">
              Ready to Explore?
            </h2>
            <p className="text-white/50 text-lg mb-8 max-w-xl mx-auto">
              Your journey through the cosmos begins now. Dive into an interactive 3D solar system.
            </p>
            <button
              onClick={handleStart}
              className="px-12 py-4 rounded-2xl bg-gradient-to-r from-cosmic-neon to-cosmic-purple text-white font-bold text-base tracking-wider uppercase transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(0,212,255,0.4)]"
            >
              Launch CosmosLearn
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-[10px] text-white/20 font-mono">
          <span>CosmosLearn &copy; 2026</span>
          <span>AI-Powered Space Explorer</span>
        </div>
      </footer>
    </div>
  )
}
