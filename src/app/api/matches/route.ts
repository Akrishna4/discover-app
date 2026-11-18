import { NextResponse } from 'next/server'
import { getMatches } from '@/lib/swipeService'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const matches = getMatches('me')
    return NextResponse.json(matches)
  } catch (err) {
    console.error('Matches error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
