'use client'

import { useState } from 'react'
import SwipeTab from './SwipeTab'
import MatchesTab from './MatchesTab'

export type SubTab = 'swipe' | 'matches'

export default function DiscoverPage() {
  const [subTab, setSubTab] = useState<SubTab>('swipe')
  const [isResetting, setIsResetting] = useState(false)
  const [resetMessage, setResetMessage] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  async function handleReset() {
    setIsResetting(true)
    try {
      const res = await fetch('/api/reset', { method: 'POST' })
      if (res.ok) {
        setResetMessage('Demo state restored!')
        setRefreshKey((k) => k + 1)
        setTimeout(() => setResetMessage(null), 2500)
      } else {
        setResetMessage('Failed to reset demo.')
        setTimeout(() => setResetMessage(null), 2500)
      }
    } catch {
      setResetMessage('Network error resetting demo.')
      setTimeout(() => setResetMessage(null), 2500)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f] text-white select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-zinc-800/80 bg-zinc-950/40 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">
            🤫
          </span>
          <div>
            <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-rose-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">
              Coy
            </h1>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">
              Zero-Knowledge Dating
            </p>
          </div>
        </div>

        {/* Small Reset demo link in the UI */}
        <button
          onClick={handleReset}
          disabled={isResetting}
          aria-label="Reset demo data"
          className="text-xs text-zinc-400 hover:text-rose-400 transition-colors px-2.5 py-1 rounded-md border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 active:scale-95 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          {isResetting ? 'Resetting…' : '↺ Reset demo'}
        </button>
      </header>

      {/* Reset status banner */}
      {resetMessage && (
        <div className="bg-rose-500/20 border-b border-rose-500/30 text-rose-300 text-xs py-1.5 px-4 text-center font-medium animate-fadeIn">
          {resetMessage}
        </div>
      )}

      {/* Sub-nav toggle between "Swipe" and "Matches" */}
      <nav
        aria-label="Discover sections"
        className="flex border-b border-zinc-800/80 bg-zinc-900/40 px-6"
      >
        <button
          role="tab"
          aria-selected={subTab === 'swipe'}
          aria-controls="swipe-panel"
          id="swipe-tab"
          className={`flex-1 py-3 text-sm font-semibold tracking-wide transition-all relative focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none ${
            subTab === 'swipe' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
          onClick={() => setSubTab('swipe')}
        >
          <span className="flex items-center justify-center gap-1.5">
            <span>🔥</span> Swipe
          </span>
          {subTab === 'swipe' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 to-amber-400 rounded-full" />
          )}
        </button>

        <button
          role="tab"
          aria-selected={subTab === 'matches'}
          aria-controls="matches-panel"
          id="matches-tab"
          className={`flex-1 py-3 text-sm font-semibold tracking-wide transition-all relative focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none ${
            subTab === 'matches' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
          onClick={() => setSubTab('matches')}
        >
          <span className="flex items-center justify-center gap-1.5">
            <span>✨</span> Matches
          </span>
          {subTab === 'matches' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 to-amber-400 rounded-full" />
          )}
        </button>
      </nav>

      {/* Content area */}
      <main className="flex-1 overflow-y-auto relative">
        {subTab === 'swipe' ? (
          <div id="swipe-panel" role="tabpanel" aria-labelledby="swipe-tab" className="h-full">
            <SwipeTab
              key={`swipe-${refreshKey}`}
              onViewMatches={() => setSubTab('matches')}
              onResetDemo={handleReset}
            />
          </div>
        ) : (
          <div id="matches-panel" role="tabpanel" aria-labelledby="matches-tab" className="h-full">
            <MatchesTab
              key={`matches-${refreshKey}`}
              onStartSwiping={() => setSubTab('swipe')}
            />
          </div>
        )}
      </main>
    </div>
  )
}
