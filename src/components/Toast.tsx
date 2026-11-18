'use client'

import { motion } from 'framer-motion'

interface ToastProps {
  message: string
}

export default function Toast({ message }: ToastProps) {
  return (
    <motion.aside
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 border border-zinc-700/80 text-zinc-100 text-xs font-medium px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 pointer-events-none"
    >
      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
      <span>{message}</span>
    </motion.aside>
  )
}
