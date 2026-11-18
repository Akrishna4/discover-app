import { NextResponse } from 'next/server'
import { resetDb } from '@/lib/db'

export async function POST() {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEMO_RESET !== 'true') {
    return NextResponse.json({ error: 'Reset endpoint is dev-only' }, { status: 403 })
  }
  try {
    resetDb()
    return NextResponse.json({ ok: true, message: 'Demo state restored' })
  } catch (err) {
    console.error('Failed to reset DB:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
