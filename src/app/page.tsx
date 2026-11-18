'use client'

import { useState } from 'react'
import DiscoverPage from '@/components/DiscoverPage'

type Tab = 'home' | 'discover'

export default function App() {
  const [tab, setTab] = useState<Tab>('discover')

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#0f0f0f] border-x border-zinc-900 shadow-2xl overflow-hidden font-sans">
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {tab === 'home' ? (
          <div
            role="tabpanel"
            id="home-panel"
            aria-labelledby="home-tab"
            className="flex flex-col items-center justify-center h-full text-zinc-600 px-6 text-center select-none"
          >
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-3xl mb-3">
              🏠
            </div>
            <h2 className="text-sm font-bold text-zinc-400">Home Feed</h2>
            <p className="text-xs text-zinc-600 mt-1 max-w-[200px]">
              Completely blank placeholder. All features live in Discover.
            </p>
          </div>
        ) : (
          <div
            role="tabpanel"
            id="discover-panel"
            aria-labelledby="discover-tab"
            className="h-full"
          >
            <DiscoverPage />
          </div>
        )}
      </main>

      {/* Bottom Tab Bar */}
      <nav
        aria-label="Bottom Navigation"
        className="flex items-center border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-4 py-2 z-20"
      >
        {/* Home Tab */}
        <button
          role="tab"
          id="home-tab"
          aria-selected={tab === 'home'}
          aria-controls="home-panel"
          onClick={() => setTab('home')}
          className={`flex-1 flex flex-col items-center py-1.5 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none ${
            tab === 'home' ? 'text-rose-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <span className="text-xl" aria-hidden="true">
            🏠
          </span>
          <span className="text-[11px] tracking-tight">Home</span>
        </button>

        {/* Discover Tab */}
        <button
          role="tab"
          id="discover-tab"
          aria-selected={tab === 'discover'}
          aria-controls="discover-panel"
          onClick={() => setTab('discover')}
          className={`flex-1 flex flex-col items-center py-1.5 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none ${
            tab === 'discover' ? 'text-rose-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <span className="text-xl" aria-hidden="true">
            🔥
          </span>
          <span className="text-[11px] tracking-tight">Discover</span>
        </button>
      </nav>
    </div>
  )
}
