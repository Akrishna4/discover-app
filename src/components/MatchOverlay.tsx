'use client'

import { motion } from 'framer-motion'
import type { Profile } from '@/types'

const ME_PHOTO = 'https://picsum.photos/seed/me/600/800'

interface MatchOverlayProps {
  matchedProfile: Profile
  onKeepSwiping: () => void
  onViewMatches: () => void
}

export default function MatchOverlay({
  matchedProfile,
  onKeepSwiping,
  onViewMatches,
}: MatchOverlayProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-heading"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 select-none animate-fadeIn"
    >
      {/* Background glow */}
      <div className="absolute w-72 h-72 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />

      {/* Title */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="text-center space-y-2 z-10"
      >
        <span className="text-4xl">💘</span>
        <h2
          id="match-heading"
          className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent drop-shadow-lg"
        >
          It&apos;s a Match!
        </h2>
        <p className="text-sm md:text-base text-zinc-300 font-medium max-w-xs mx-auto">
          You and <span className="text-white font-bold">{matchedProfile.name}</span> secretly liked each other!
        </p>
      </motion.div>

      {/* Avatars side by side */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring' }}
        className="flex items-center justify-center gap-4 my-8 z-10"
      >
        {/* 'me' photo */}
        <div className="relative">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-rose-500 shadow-2xl shadow-rose-500/40">
            <img
              src={ME_PHOTO}
              alt="Your profile photo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="absolute bottom-0 right-0 bg-zinc-900 border border-zinc-700 text-xs px-2 py-0.5 rounded-full text-zinc-300 font-semibold shadow">
            You
          </span>
        </div>

        {/* Heart icon separator */}
        <div className="text-2xl text-rose-500 animate-pulse">
          💖
        </div>

        {/* Match photo */}
        <div className="relative">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-amber-400 shadow-2xl shadow-amber-400/40">
            <img
              src={matchedProfile.photo}
              alt={`Photo of ${matchedProfile.name}`}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="absolute bottom-0 right-0 bg-zinc-900 border border-zinc-700 text-xs px-2 py-0.5 rounded-full text-zinc-300 font-semibold shadow truncate max-w-[80px]">
            {matchedProfile.name.split(' ')[0]}
          </span>
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col gap-3 w-full max-w-xs z-10"
      >
        <button
          onClick={onViewMatches}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-sm tracking-wide shadow-xl shadow-rose-900/40 transition active:scale-95 focus-visible:ring-4 focus-visible:ring-rose-400 focus-visible:outline-none"
        >
          View Matches
        </button>
        <button
          onClick={onKeepSwiping}
          className="w-full py-3.5 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-semibold text-sm transition active:scale-95 focus-visible:ring-4 focus-visible:ring-zinc-500 focus-visible:outline-none"
        >
          Keep Swiping
        </button>
      </motion.div>
    </div>
  )
}
