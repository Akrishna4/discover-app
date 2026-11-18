'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import type { Profile, SwipeResponse } from '@/types'
import MatchOverlay from './MatchOverlay'
import Toast from './Toast'

const SWIPE_THRESHOLD = 90

interface SwipeTabProps {
  onViewMatches?: () => void
  onResetDemo?: () => void
}

export default function SwipeTab({ onViewMatches, onResetDemo }: SwipeTabProps) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [match, setMatch] = useState<Profile | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const isSwiping = useRef(false)
  const topCardTriggerRef = useRef<((action: 'like' | 'pass') => Promise<void>) | null>(null)

  const fetchFeed = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/feed')
      if (!res.ok) throw new Error('Failed to load feed')
      const data = (await res.json()) as Profile[]
      setProfiles(data)
    } catch {
      setError('Unable to load profiles. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFeed()
  }, [fetchFeed])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const commitSwipe = useCallback(
    async (profile: Profile, action: 'like' | 'pass') => {
      if (isSwiping.current) return
      isSwiping.current = true

      // 1. Optimistic removal: remove card immediately from UI stack
      setProfiles((prev) => prev.filter((p) => p.id !== profile.id))

      try {
        const res = await fetch('/swipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId: profile.id, action }),
        })
        const data = (await res.json()) as SwipeResponse

        if (!res.ok) {
          // On API failure: restore the card to top and notify user
          setProfiles((prev) => [profile, ...prev])
          showToast('Swipe failed to save. Card returned.')
        } else if (data.matched && data.profile) {
          // Mutual match!
          setMatch(data.profile)
        }
      } catch {
        // Network failure: restore card
        setProfiles((prev) => [profile, ...prev])
        showToast('Network error. Profile returned to feed.')
      } finally {
        isSwiping.current = false
      }
    },
    []
  )

  const handleActionClick = (action: 'like' | 'pass') => {
    if (profiles.length === 0 || isSwiping.current) return
    if (topCardTriggerRef.current) {
      topCardTriggerRef.current(action)
    } else {
      commitSwipe(profiles[0], action)
    }
  }

  // Keyboard navigation: Left Arrow = Pass, Right Arrow = Like
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Ignore if user is interacting with form controls or overlay is open
      if (match) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleActionClick('like')
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handleActionClick('pass')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [profiles, match])

  // Loading skeleton
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 py-6">
        <div className="relative w-full max-w-sm h-[520px]">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-3xl bg-zinc-900 border border-zinc-800 p-6 flex flex-col justify-end animate-pulse shadow-2xl"
              style={{
                transform: `scale(${1 - i * 0.04}) translateY(${i * 12}px)`,
                zIndex: 2 - i,
              }}
            >
              <div className="h-6 w-3/5 bg-zinc-800 rounded-md mb-2" />
              <div className="h-4 w-2/5 bg-zinc-800/60 rounded-md mb-4" />
              <div className="h-3 w-4/5 bg-zinc-800/40 rounded-md mb-2" />
              <div className="h-3 w-3/5 bg-zinc-800/40 rounded-md mb-4" />
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-zinc-800/80 rounded-full" />
                <div className="h-6 w-20 bg-zinc-800/80 rounded-full" />
                <div className="h-6 w-14 bg-zinc-800/80 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-3xl">
          ⚠️
        </div>
        <h2 className="text-lg font-bold text-white">Something went wrong</h2>
        <p className="text-sm text-zinc-400 max-w-xs">{error}</p>
        <button
          onClick={fetchFeed}
          className="mt-2 px-5 py-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold transition active:scale-95 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Empty state when feed is exhausted
  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500/20 to-amber-500/20 border border-zinc-800 flex items-center justify-center text-4xl shadow-inner">
          ✨
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">You&apos;ve seen everyone!</h2>
          <p className="text-sm text-zinc-400 max-w-xs">
            There are no more new profiles right now. Check your mutual matches or reset the demo to start fresh.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full max-w-xs">
          <button
            onClick={onViewMatches}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold text-sm shadow-lg shadow-rose-900/30 transition active:scale-95 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          >
            View Matches
          </button>
          <button
            onClick={onResetDemo || (() => fetch('/api/reset', { method: 'POST' }).then(() => fetchFeed()))}
            className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-semibold text-sm transition active:scale-95 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none"
          >
            Reset Demo
          </button>
        </div>
      </div>
    )
  }

  const currentProfile = profiles[0]
  const nextProfile = profiles[1]

  return (
    <div className="flex flex-col items-center justify-between h-full py-4 px-4">
      {/* Cards container */}
      <div className="relative w-full max-w-sm h-[520px] mx-auto select-none">
        {/* Next card peeking behind */}
        {nextProfile && (
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800/80 shadow-xl transition-all duration-300"
            style={{
              transform: 'scale(0.95) translateY(12px)',
              zIndex: 1,
              opacity: 0.85,
            }}
          >
            <img
              src={nextProfile.photo}
              alt=""
              className="w-full h-full object-cover brightness-[0.7]"
              draggable={false}
            />
            {/* Subtle info preview */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/60 to-transparent">
              <p className="text-xl font-bold text-white/80">
                {nextProfile.name}, {nextProfile.age}
              </p>
              <p className="text-xs text-zinc-400">📍 {nextProfile.location}</p>
            </div>
          </div>
        )}

        {/* Top interactive card */}
        <TopCard
          key={currentProfile.id}
          profile={currentProfile}
          onSwipe={commitSwipe}
          triggerRef={topCardTriggerRef}
        />
      </div>

      {/* Action controls (Like, Pass, Keyboard hints) */}
      <div className="flex flex-col items-center gap-2 mt-4 w-full max-w-sm">
        <div className="flex items-center justify-center gap-10">
          {/* Pass Button */}
          <button
            type="button"
            aria-label={`Pass on ${currentProfile.name}`}
            onClick={() => handleActionClick('pass')}
            className="w-16 h-16 rounded-full bg-zinc-900 border-2 border-rose-500/40 text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/30 active:scale-90 transition-all flex items-center justify-center text-2xl focus-visible:ring-4 focus-visible:ring-rose-500 focus-visible:outline-none"
          >
            ✕
          </button>

          {/* Like Button */}
          <button
            type="button"
            aria-label={`Like ${currentProfile.name}`}
            onClick={() => handleActionClick('like')}
            className="w-16 h-16 rounded-full bg-zinc-900 border-2 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-90 transition-all flex items-center justify-center text-3xl focus-visible:ring-4 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            ♥
          </button>
        </div>

        {/* Desktop helper hint */}
        <p className="text-[11px] text-zinc-500 font-medium">
          Drag card or use <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">←</kbd> Pass / <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">→</kbd> Like
        </p>
      </div>

      {/* Match Overlay */}
      {match && (
        <MatchOverlay
          matchedProfile={match}
          onKeepSwiping={() => setMatch(null)}
          onViewMatches={() => {
            setMatch(null)
            if (onViewMatches) onViewMatches()
          }}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} />}
    </div>
  )
}

interface TopCardProps {
  profile: Profile
  onSwipe: (profile: Profile, action: 'like' | 'pass') => void
  triggerRef: React.MutableRefObject<((action: 'like' | 'pass') => Promise<void>) | null>
}

function TopCard({ profile, onSwipe, triggerRef }: TopCardProps) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 300], [-18, 18])
  const likeOpacity = useTransform(x, [0, 80], [0, 1])
  const nopeOpacity = useTransform(x, [-80, 0], [1, 0])

  // Attach programmatic trigger so buttons/arrow keys run the same animation
  useEffect(() => {
    triggerRef.current = async (action: 'like' | 'pass') => {
      const targetX = action === 'like' ? 600 : -600
      await animate(x, targetX, { duration: 0.3, ease: 'easeOut' })
      onSwipe(profile, action)
    }
    return () => {
      triggerRef.current = null
    }
  }, [profile, onSwipe, x, triggerRef])

  const handleDragEnd = async (_: unknown, info: { offset: { x: number } }) => {
    const offset = info.offset.x
    if (Math.abs(offset) > SWIPE_THRESHOLD) {
      const action = offset > 0 ? 'like' : 'pass'
      const targetX = offset > 0 ? 600 : -600
      // Fly-off on commit
      await animate(x, targetX, { duration: 0.25, ease: 'easeOut' })
      onSwipe(profile, action)
    } else {
      // Spring back below threshold
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 28 })
    }
  }

  return (
    <motion.div
      role="region"
      aria-label={`Profile card of ${profile.name}, age ${profile.age}, located in ${profile.location}`}
      className="absolute inset-0 rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-700/80 shadow-2xl cursor-grab active:cursor-grabbing will-change-transform touch-none"
      style={{
        x,
        rotate,
        zIndex: 10,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
    >
      {/* Background Photo */}
      <img
        src={profile.photo}
        alt={`Photo of ${profile.name}`}
        className="w-full h-full object-cover pointer-events-none select-none"
        draggable={false}
      />

      {/* LIKE Stamp (green, top-left, fades in with drag right) */}
      <motion.div
        aria-hidden="true"
        className="absolute top-8 left-6 border-4 border-emerald-400 text-emerald-400 font-black text-3xl px-4 py-1.5 rounded-2xl rotate-[-18deg] tracking-widest pointer-events-none shadow-lg bg-black/30 backdrop-blur-xs"
        style={{ opacity: likeOpacity }}
      >
        LIKE
      </motion.div>

      {/* NOPE Stamp (red, top-right, fades in with drag left) */}
      <motion.div
        aria-hidden="true"
        className="absolute top-8 right-6 border-4 border-rose-500 text-rose-500 font-black text-3xl px-4 py-1.5 rounded-2xl rotate-[18deg] tracking-widest pointer-events-none shadow-lg bg-black/30 backdrop-blur-xs"
        style={{ opacity: nopeOpacity }}
      >
        NOPE
      </motion.div>

      {/* Card Info Overlay (bottom gradient) */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/75 to-transparent flex flex-col gap-2.5 pointer-events-none">
        <div className="flex items-baseline gap-2">
          <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
            {profile.name}
          </h2>
          <span className="text-xl font-medium text-zinc-300">
            {profile.age}
          </span>
        </div>

        <p className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
          <span>📍</span> {profile.location}
        </p>

        <p className="text-xs text-zinc-300/90 leading-relaxed line-clamp-2">
          {profile.bio}
        </p>

        {/* Interests Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1" aria-label="Interests">
          {profile.interests.map((interest) => (
            <span
              key={interest}
              className="text-[11px] font-medium bg-white/15 border border-white/20 text-white px-2.5 py-0.5 rounded-full backdrop-blur-sm shadow-sm"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
