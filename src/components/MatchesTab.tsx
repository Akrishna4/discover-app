'use client'

import { useEffect, useState } from 'react'
import type { Match } from '@/types'

// Hardcoded sample interests for 'me' to demonstrate shared interest highlighting
const MY_INTERESTS = ['chess', 'photography', 'cooking', 'music', 'travel', 'cycling']

interface MatchesTabProps {
  onStartSwiping?: () => void
}

export default function MatchesTab({ onStartSwiping }: MatchesTabProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadMatches() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/matches')
        if (!res.ok) throw new Error('Failed to load matches')
        const data = (await res.json()) as Match[]
        setMatches(data)
      } catch {
        setError('Unable to load matches.')
      } finally {
        setLoading(false)
      }
    }
    loadMatches()
  }, [])

  if (loading) {
    return (
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-zinc-900 border border-zinc-800 p-3 flex flex-col justify-end h-64 animate-pulse shadow-md"
          >
            <div className="h-4 w-3/4 bg-zinc-800 rounded mb-2" />
            <div className="h-3 w-1/2 bg-zinc-800/60 rounded mb-3" />
            <div className="h-5 w-20 bg-zinc-800/80 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-72 text-center px-4 gap-3">
        <p className="text-2xl">⚠️</p>
        <p className="text-white font-semibold text-sm">{error}</p>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-72 text-center px-6 gap-3">
        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-3xl">
          💭
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-white">No matches yet</h2>
          <p className="text-xs text-zinc-400 max-w-xs">
            Matches only happen when you both like each other. Start swiping to uncover mutual connections!
          </p>
        </div>
        {onStartSwiping && (
          <button
            onClick={onStartSwiping}
            className="mt-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-semibold text-xs tracking-wide shadow-md transition active:scale-95 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          >
            Start Swiping
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3 pb-12">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Mutual Matches ({matches.length})
        </h2>
        <span className="text-[11px] text-zinc-500">
          Shared interests highlighted
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {matches.map(({ profile, matchedAt }) => {
          // Identify shared interests between 'me' and this profile
          const sharedInterests = profile.interests.filter((i) =>
            MY_INTERESTS.some((my) => my.toLowerCase() === i.toLowerCase())
          )
          const otherInterests = profile.interests.filter(
            (i) => !sharedInterests.includes(i)
          )

          return (
            <article
              key={profile.id}
              aria-label={`Match: ${profile.name}, age ${profile.age}`}
              className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/90 shadow-lg flex flex-col hover:border-zinc-700 transition"
            >
              {/* Photo */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-800">
                <img
                  src={profile.photo}
                  alt={`Photo of ${profile.name}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {/* Name & Age Overlay */}
                <div className="absolute bottom-2 left-2.5 right-2.5">
                  <h3 className="text-sm font-bold text-white drop-shadow truncate">
                    {profile.name}, {profile.age}
                  </h3>
                  <p className="text-[11px] text-zinc-300 drop-shadow truncate">
                    📍 {profile.location}
                  </p>
                </div>
              </div>

              {/* Card Footer: Interests & Match Date */}
              <div className="p-2.5 flex flex-col gap-1.5 flex-1 justify-between bg-zinc-900">
                <div className="space-y-1">
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                    Interests
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {/* Shared interests with distinctive badge */}
                    {sharedInterests.map((interest) => (
                      <span
                        key={interest}
                        title="Shared interest!"
                        className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-md"
                      >
                        ★ {interest}
                      </span>
                    ))}
                    {otherInterests.slice(0, 2).map((interest) => (
                      <span
                        key={interest}
                        className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded-md"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>Matched</span>
                  <time dateTime={matchedAt}>
                    {new Date(matchedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
