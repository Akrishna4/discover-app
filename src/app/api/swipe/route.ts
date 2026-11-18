import { NextRequest, NextResponse } from 'next/server'
import { recordSwipe } from '@/lib/swipeService'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { profileId, action } = body || {}

  if (!profileId || typeof profileId !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid profileId' }, { status: 400 })
  }
  if (!action || (action !== 'like' && action !== 'pass')) {
    return NextResponse.json({ error: 'action must be "like" or "pass"' }, { status: 400 })
  }

  try {
    const result = recordSwipe('me', profileId, action)
    return NextResponse.json(result)
  } catch (err: any) {
    if (err?.message === 'PROFILE_NOT_FOUND') {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    if (err?.message === 'DUPLICATE_SWIPE') {
      return NextResponse.json({ error: 'Already swiped on this profile' }, { status: 409 })
    }
    console.error('Swipe error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
