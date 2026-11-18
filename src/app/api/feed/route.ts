import { NextResponse } from 'next/server'
import { getFeed } from '@/lib/swipeService'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const profiles = getFeed('me')
    return NextResponse.json(profiles)
  } catch (err) {
    console.error('Feed error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
