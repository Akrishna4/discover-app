import db, { getFeedSeed } from './db'
import type { Profile, SwipeAction, SwipeResponse, Match } from '@/types'

function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    name: row.name as string,
    age: row.age as number,
    photo: row.photo as string,
    bio: row.bio as string,
    location: row.location as string,
    interests: JSON.parse(row.interests_json as string) as string[],
  }
}

export function getFeed(userId: string): Profile[] {
  // Profiles that userId has NOT swiped on.
  // Never include any field that hints whether a profile liked "me".
  // Order must not favour liked-me profiles (stable shuffle using session_seed).
  const sessionSeed = getFeedSeed()
  const rows = db
    .prepare(
      `SELECT id, name, age, photo, bio, location, interests_json
       FROM profiles
       WHERE id NOT IN (
         SELECT to_user FROM swipes WHERE from_user = ?
       )
       AND id != ?
       ORDER BY feed_hash(id, ?)`
    )
    .all(userId, userId, sessionSeed) as Record<string, unknown>[]

  return rows.map(rowToProfile)
}

export function recordSwipe(
  fromUser: string,
  toUser: string,
  action: SwipeAction
): SwipeResponse {
  // Check toUser exists
  const target = db
    .prepare('SELECT id FROM profiles WHERE id = ?')
    .get(toUser) as { id: string } | undefined
  if (!target) {
    throw new Error('PROFILE_NOT_FOUND')
  }

  const recordSwipeTx = db.transaction((): SwipeResponse => {
    // Check for duplicate swipe
    const existing = db
      .prepare('SELECT action FROM swipes WHERE from_user = ? AND to_user = ?')
      .get(fromUser, toUser)
    if (existing) {
      throw new Error('DUPLICATE_SWIPE')
    }

    db.prepare(
      `INSERT INTO swipes (from_user, to_user, action, created_at)
       VALUES (?, ?, ?, datetime('now'))`
    ).run(fromUser, toUser, action)

    if (action === 'like') {
      // Check if target profile already liked fromUser
      const mutual = db
        .prepare(
          `SELECT 1 FROM swipes WHERE from_user = ? AND to_user = ? AND action = 'like'`
        )
        .get(toUser, fromUser)

      if (mutual) {
        // Written inside the same transaction as the swipe that creates the match
        const [user_a, user_b] = [fromUser, toUser].sort()
        db.prepare(
          `INSERT OR IGNORE INTO matches (user_a, user_b, created_at)
           VALUES (?, ?, datetime('now'))`
        ).run(user_a, user_b)

        const profileRow = db
          .prepare(
            'SELECT id, name, age, photo, bio, location, interests_json FROM profiles WHERE id = ?'
          )
          .get(toUser) as Record<string, unknown> | undefined

        return {
          matched: true,
          profile: profileRow ? rowToProfile(profileRow) : undefined,
        }
      }
    }

    return { matched: false }
  })

  return recordSwipeTx()
}

export function getMatches(userId: string): Match[] {
  // Mutual matches only
  const rows = db
    .prepare(
      `SELECT
         p.id, p.name, p.age, p.photo, p.bio, p.location, p.interests_json,
         m.created_at as matched_at
       FROM matches m
       JOIN profiles p ON (
         CASE WHEN m.user_a = ? THEN m.user_b ELSE m.user_a END = p.id
       )
       WHERE m.user_a = ? OR m.user_b = ?
       ORDER BY m.created_at DESC`
    )
    .all(userId, userId, userId) as (Record<string, unknown> & { matched_at: string })[]

  return rows.map((row) => ({
    profile: rowToProfile(row),
    matchedAt: row.matched_at as string,
  }))
}
