import { describe, it, expect, beforeEach } from 'vitest'
import db, { resetDb } from '@/lib/db'
import { getFeed, recordSwipe, getMatches } from '@/lib/swipeService'
import { POST as swipeRoute } from '@/app/api/swipe/route'
import { NextRequest } from 'next/server'

function clearSwipesAndMatches() {
  db.exec('DELETE FROM swipes; DELETE FROM matches;')
}

beforeEach(() => {
  clearSwipesAndMatches()
})

describe('Coy Swipe Service & Privacy Rules', () => {
  it('1. like with no prior like -> no match', () => {
    // p02 has not liked 'me'
    const result = recordSwipe('me', 'p02', 'like')
    expect(result.matched).toBe(false)
    expect(result.profile).toBeUndefined()

    // Ensure no match was recorded in matches table
    const matches = getMatches('me')
    expect(matches).toHaveLength(0)
  })

  it('2. like with prior like -> match (mutual)', () => {
    // Simulate p02 previously liking 'me'
    db.prepare(
      `INSERT INTO swipes (from_user, to_user, action, created_at) VALUES ('p02', 'me', 'like', datetime('now'))`
    ).run()

    // 'me' likes p02 back
    const result = recordSwipe('me', 'p02', 'like')
    expect(result.matched).toBe(true)
    expect(result.profile).toBeDefined()
    expect(result.profile?.id).toBe('p02')
    expect(result.profile?.name).toBe('Priya Nair')

    // Mutual match appears in matches
    const matches = getMatches('me')
    expect(matches).toHaveLength(1)
    expect(matches[0].profile.id).toBe('p02')
  })

  it('3. pass never matches even if prior like existed', () => {
    // p04 previously liked 'me'
    db.prepare(
      `INSERT INTO swipes (from_user, to_user, action, created_at) VALUES ('p04', 'me', 'like', datetime('now'))`
    ).run()

    // 'me' passes on p04
    const result = recordSwipe('me', 'p04', 'pass')
    expect(result.matched).toBe(false)
    expect(result.profile).toBeUndefined()

    // Passing reveals nothing and p04 never appears in matches
    const matches = getMatches('me')
    expect(matches).toHaveLength(0)
  })

  it('4. duplicate swipe handling (throws DUPLICATE_SWIPE)', () => {
    recordSwipe('me', 'p05', 'like')
    expect(() => recordSwipe('me', 'p05', 'like')).toThrow('DUPLICATE_SWIPE')
    expect(() => recordSwipe('me', 'p05', 'pass')).toThrow('DUPLICATE_SWIPE')
  })

  it('5. feed excludes swiped profiles (both liked and passed)', () => {
    const initialFeed = getFeed('me')
    expect(initialFeed.some((p) => p.id === 'p01')).toBe(true)
    expect(initialFeed.some((p) => p.id === 'p02')).toBe(true)

    // Swipe 'like' on p01 and 'pass' on p02
    recordSwipe('me', 'p01', 'like')
    recordSwipe('me', 'p02', 'pass')

    const updatedFeed = getFeed('me')
    const ids = updatedFeed.map((p) => p.id)
    expect(ids).not.toContain('p01')
    expect(ids).not.toContain('p02')
  })

  it('6. feed response never contains liked-me info or leaks liked-me set', () => {
    // Re-seed liked-me set
    resetDb()

    const feed = getFeed('me')
    expect(feed.length).toBeGreaterThan(0)

    // Exactly allowed Profile fields: id, name, age, photo, bio, location, interests
    const allowedKeys = new Set(['id', 'name', 'age', 'photo', 'bio', 'location', 'interests'])

    for (const profile of feed) {
      const keys = Object.keys(profile)
      for (const key of keys) {
        expect(allowedKeys.has(key)).toBe(true)
      }
      // Ensure no sneaky fields like 'liked_me', 'mutual', 'swipe_status'
      expect((profile as any).liked_me).toBeUndefined()
      expect((profile as any).likedMe).toBeUndefined()
      expect((profile as any).hasLiked).toBeUndefined()
      expect((profile as any).action).toBeUndefined()
    }
  })

  it('7. feed order does not favour liked-me profiles (deterministic id order)', () => {
    resetDb()
    const feed = getFeed('me')
    const ids = feed.map((p) => p.id)
    const sortedIds = [...ids].sort()
    expect(ids).toEqual(sortedIds)
  })

  it('8. matches returns only mutual matches', () => {
    // 1. One-way like: 'me' likes p01 (who has not liked 'me')
    recordSwipe('me', 'p01', 'like')
    expect(getMatches('me')).toHaveLength(0)

    // 2. One-way like: p06 likes 'me' (but 'me' hasn't swiped back yet)
    db.prepare(
      `INSERT INTO swipes (from_user, to_user, action, created_at) VALUES ('p06', 'me', 'like', datetime('now'))`
    ).run()
    expect(getMatches('me')).toHaveLength(0)

    // 3. Mutual like: 'me' likes p06 back
    recordSwipe('me', 'p06', 'like')
    const matches = getMatches('me')
    expect(matches).toHaveLength(1)
    expect(matches[0].profile.id).toBe('p06')
  })

  it('9. unknown profile throws PROFILE_NOT_FOUND', () => {
    expect(() => recordSwipe('me', 'non_existent_profile', 'like')).toThrow('PROFILE_NOT_FOUND')
  })

  it('10. invalid swipe action is rejected by DB constraint', () => {
    expect(() => {
      db.prepare(
        `INSERT INTO swipes (from_user, to_user, action, created_at) VALUES ('me', 'p10', 'superlike', datetime('now'))`
      ).run()
    }).toThrow()
  })

  it('11. API route /api/swipe validation (400 bad body, 404 unknown profile, 409 duplicate)', async () => {
    // 400 bad body (missing action)
    const req1 = new NextRequest('http://localhost:3000/api/swipe', {
      method: 'POST',
      body: JSON.stringify({ profileId: 'p01' }),
    })
    const res1 = await swipeRoute(req1)
    expect(res1.status).toBe(400)

    // 400 invalid action
    const req2 = new NextRequest('http://localhost:3000/api/swipe', {
      method: 'POST',
      body: JSON.stringify({ profileId: 'p01', action: 'superlike' }),
    })
    const res2 = await swipeRoute(req2)
    expect(res2.status).toBe(400)

    // 404 unknown profile
    const req3 = new NextRequest('http://localhost:3000/api/swipe', {
      method: 'POST',
      body: JSON.stringify({ profileId: 'p9999', action: 'like' }),
    })
    const res3 = await swipeRoute(req3)
    expect(res3.status).toBe(404)

    // Valid swipe -> 200
    const req4 = new NextRequest('http://localhost:3000/api/swipe', {
      method: 'POST',
      body: JSON.stringify({ profileId: 'p01', action: 'like' }),
    })
    const res4 = await swipeRoute(req4)
    expect(res4.status).toBe(200)

    // Duplicate swipe -> 409
    const req5 = new NextRequest('http://localhost:3000/api/swipe', {
      method: 'POST',
      body: JSON.stringify({ profileId: 'p01', action: 'like' }),
    })
    const res5 = await swipeRoute(req5)
    expect(res5.status).toBe(409)
  })
})
