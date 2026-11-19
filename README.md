# discover-app

Built as a take-home assignment for the Coy SDE Intern role.

**Live demo:** https://discover-app.onrender.com  
(Hosted on Render's free tier: the first load after inactivity can take ~50s, and data resets whenever the service restarts.)

> **Coy** is a consumer app whose core promise is **privacy**: you never learn who likes you unless the feeling is mutual.

This repository contains the standalone **"Discover"** tab — a mobile-first, zero-knowledge dating swipe experience built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, and **SQLite (better-sqlite3)**.

---

## Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │              Browser (UI)              │
                      │  App Shell: Bottom Bar (Home/Discover) │
                      │  Discover: Sub-nav (Swipe / Matches)   │
                      │  Gesture Deck (Framer Motion Drag/Keys)│
                      └───────────────────┬────────────────────┘
                                          │ HTTP (rewrites)
               ┌──────────────────────────┴──────────────────────────┐
               │                                                     │
               ▼                                                     ▼
    ┌──────────────────────┐                              ┌──────────────────────┐
    │   GET /feed          │                              │   POST /swipe        │
    │   GET /matches       │                              │   POST /api/reset    │
    └──────────┬───────────┘                              └──────────┬───────────┘
               │                                                     │
               └──────────────────────────┬──────────────────────────┘
                                          ▼
                      ┌────────────────────────────────────────┐
                      │       lib/swipeService.ts (Pure)       │
                      │  - getFeed(userId)                     │
                      │  - recordSwipe(from, to, action)       │
                      │  - getMatches(userId)                  │
                      └───────────────────┬────────────────────┘
                                          ▼
                      ┌────────────────────────────────────────┐
                      │       lib/db.ts (better-sqlite3)       │
                      │  SQLite WAL mode + Foreign Keys        │
                      │  Tables: profiles, swipes, matches     │
                      └────────────────────────────────────────┘
```

- **Separation of Concerns**: Pure domain logic resides in `lib/swipeService.ts` (independent of HTTP / Next.js request objects). Route handlers in `app/api/*` act as thin validation and transport adapters.
- **Rewrites**: `next.config.mjs` maps clean URLs (`/feed`, `/swipe`, `/matches`) directly to their respective API route handlers under `/api/*`.
- **Single Logged-in Identity**: Default demo user is identified by the constant `"me"`.
- **Storage**: Local SQLite database located in `data/coy.db`, auto-created and pre-seeded on first run.

---

## Database Schema

```sql
-- 1. Profiles catalogue
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  photo TEXT NOT NULL,
  bio TEXT NOT NULL,
  location TEXT NOT NULL,          -- City OR College
  interests_json TEXT NOT NULL     -- Serialized JSON array of strings
);

-- 2. Swipes log (Zero-Knowledge)
CREATE TABLE IF NOT EXISTS swipes (
  from_user TEXT NOT NULL,
  to_user TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('like', 'pass')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (from_user, to_user)
);

-- 3. Mutual matches (written inside the swipe transaction)
CREATE TABLE IF NOT EXISTS matches (
  user_a TEXT NOT NULL,
  user_b TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_a, user_b)
);

-- 4. Application metadata (stores reload-stable feed session seed)
CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

### Seeding
- **32 realistic profiles**: Diverse Indian names, colleges (IIT Delhi, BITS Pilani, IIM Ahmedabad, VJTI Mumbai, etc.) and cities (Bengaluru, Pune, Kolkata, Kochi, Jaipur, etc.), each with 3–5 interests and deterministic placeholder photos (`https://picsum.photos/seed/<id>/600/800`).
- **9 pre-seeded "liked-me" rows**: `p04`, `p07`, `p11`, `p14`, `p19`, `p22`, `p26`, `p29`, `p31` have already swiped `like` on `"me"`.
- **Idempotency**: All seed statements use `INSERT OR IGNORE` and are wrapped in database transactions.

---

## API Contract

All endpoints are available both directly under `/api/*` and at top-level paths (`/feed`, `/swipe`, `/matches`) via Next.js rewrites.

### 1. `GET /feed`
Returns candidate profiles that `"me"` has not yet swiped on.

- **URL**: `/feed` or `/api/feed`
- **Method**: `GET`
- **Response**: `200 OK`
```json
[
  {
    "id": "p01",
    "name": "Aarav Sharma",
    "age": 22,
    "photo": "https://picsum.photos/seed/p01/600/800",
    "bio": "CS undergrad obsessed with distributed systems and midnight chai.",
    "location": "IIT Delhi",
    "interests": ["distributed systems", "chess", "hindi rap", "photography", "cycling"]
  }
]
```
> **Privacy Guarantee**: Does not contain any indicator, score, or metadata revealing if a profile has liked `"me"`. Profiles are ordered deterministically by `id`.

---

### 2. `POST /swipe`
Submits a swipe decision (`like` or `pass`). Runs atomically in an SQLite transaction.

- **URL**: `/swipe` or `/api/swipe`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "profileId": "p04",
  "action": "like"
}
```
- **Response**: `200 OK`
  - Mutual match occurred:
    ```json
    {
      "matched": true,
      "profile": {
        "id": "p04",
        "name": "Ananya Iyer",
        "age": 21,
        "photo": "https://picsum.photos/seed/p04/600/800",
        "bio": "Marine biology enthusiast, amateur chef and terrible dancer.",
        "location": "Chennai",
        "interests": ["marine biology", "cooking", "dancing", "classical literature"]
      }
    }
    ```
  - No match (either one-way like or pass):
    ```json
    {
      "matched": false
    }
    ```
- **Errors**:
  - `400 Bad Request`: Missing `profileId` or `action` not in `['like', 'pass']`.
  - `404 Not Found`: Profile does not exist.
  - `409 Conflict`: Duplicate swipe (user has already swiped on this profile).

---

### 3. `GET /matches`
Returns the list of confirmed mutual matches for `"me"`.

- **URL**: `/matches` or `/api/matches`
- **Method**: `GET`
- **Response**: `200 OK`
```json
[
  {
    "profile": {
      "id": "p04",
      "name": "Ananya Iyer",
      "age": 21,
      "photo": "https://picsum.photos/seed/p04/600/800",
      "bio": "Marine biology enthusiast, amateur chef and terrible dancer.",
      "location": "Chennai",
      "interests": ["marine biology", "cooking", "dancing", "classical literature"]
    },
    "matchedAt": "2026-11-18 15:57:45"
  }
]
```

---

### 4. `POST /api/reset` (Dev-Only)
Restores the database to initial demo state (clears all user swipes & matches, and restores the 9 seeded "liked-me" rows).

- **URL**: `/api/reset`
- **Method**: `POST`
- **Response**: `200 OK`
```json
{
  "ok": true,
  "message": "Demo state restored"
}
```

---

## How Privacy is Enforced (Hard Requirements)

1. **Zero-Knowledge Feed**:
   - `getFeed('me')` queries only `profiles WHERE id NOT IN (SELECT to_user FROM swipes WHERE from_user = 'me')`.
   - The returned schema is strictly `Profile` (`id, name, age, photo, bio, location, interests`). It never contains flags such as `is_liked_by`, `liked_me`, or match scores.
2. **Deterministic, Unbiased Stable Shuffle**:
   - Candidates are ordered by `feed_hash(id, session_seed)` (SHA-256 HMAC of ID and session seed), where `session_seed` is generated once per database reset and stored in `app_meta`.
   - The feed order is 100% stable across browser reloads, while remaining completely decoupled from candidate IDs, creation times, or liked-me status.
   - Position in the feed never leaks whether a candidate liked `"me"`. Liked-me profiles are spread evenly across the catalogue rather than clustered at low IDs.
3. **Silent Passing**:
   - Swiping `pass` on someone who liked `"me"` writes `(me, target, pass)` to `swipes`.
   - The response is `{ matched: false }` — identical to passing on someone who did not like `"me"`.
   - The passed profile is excluded from the feed permanently and **never** appears in `matches`.
4. **Uniform Errors & Responses**:
   - A `like` that does not result in a mutual match yields `{ matched: false }` without hinting whether the target is active or has swiped.
5. **Atomic Match Creation**:
   - `matches` rows are only written inside the same ACID transaction as the mutual `like`. No intermediary "pending match" state exists.

---

## How to Demo a Match

In production Coy, liked-me profiles are intentionally **never** visible in the UI. In addition, candidate cards are shuffled using a stable per-session seed and liked-me profiles are distributed across the catalog (the first card is **not** a match), preventing position-based leaks.

On the live demo, click Reset demo first, then swipe right on any liked-me profile ID listed in `src/lib/db.ts` to see the match overlay.

For evaluation and grading, follow this demo path:

1. **Check the Seed File for Liked-Me IDs**:
   - The seed file ([src/lib/db.ts](file:///Users/ayushkrishna/docs/proj/coy/src/lib/db.ts)) defines `likedMeIds` spread across the entire ID range:
     - `p04` — **Ananya Iyer** (Chennai, Marine biology)
     - `p07` — **Arjun Verma** (Hyderabad, Backend dev & rock climbing)
     - `p11` — **Ishaan Kapoor** (Delhi, Architecture & startups)
     - `p14` — **Pooja Desai** (Ahmedabad, Fashion & textiles)
     - `p19` — **Samar Khan** (Jaipur, Graphic novels & heritage walks)
     - `p22` — **Kritika Malhotra** (Chandigarh, Environmental law)
     - `p26` — **Aditi Saxena** (Bhopal, UX research & accessibility)
     - `p29` — **Mansi Rawat** (Dehradun, Adventure sports & hospitality)
     - `p31` — **Bhavna Choksi** (Vadodara, Fine arts & generative art)
   - *Note*: `p01` (Aarav Sharma), `p02` (Priya Nair), and `p03` (Rohan Mehta) have **not** liked `"me"`.
2. **Test One-Way Like (No Match & No Leak)**:
   - Launch the app ([http://localhost:3000](http://localhost:3000) or on the live demo).
   - If the current card is a non-liked profile (such as Aarav Sharma, Priya Nair, etc.), swipe right (Like).
   - The card flies off smoothly and the next card appears. Because the like is one-way, no match modal appears and no hint is leaked.
3. **Trigger a Mutual Match**:
   - Continue swiping until you encounter one of the profiles from `likedMeIds` listed above (e.g., **Ananya Iyer**, **Arjun Verma**, or **Ishaan Kapoor**).
   - Swipe right (drag right, click **♥**, or press **→**).
   - The full-screen celebration modal (**"It's a Match! 💫"**) immediately triggers, displaying both profile pictures.
4. **View Mutual Matches**:
   - Click **"View Matches"** on the modal or switch to the **Matches** sub-nav tab.
   - The matched candidate appears in the grid with shared interests highlighted (e.g. `★ chess`, `★ cycling`).
5. **Test Silent Passing**:
   - Switch back to **Swipe**. When you encounter any other profile that liked `"me"`, swipe left (Pass).
   - The card slides away silently. No match is created and the profile never appears in Matches.
6. **Reload Persistence**:
   - Refresh the page (`Cmd+R` / `F5`).
   - The feed order remains stable, and previously swiped profiles never reappear.
7. **Reset Demo State**:
   - Click the small **"↺ Reset demo"** link in the top header or from the feed empty state.
   - The demo database immediately resets all swipes, re-seeds the 9 liked-me rows, and regenerates a fresh stable shuffle seed.

---

## Setup & Running Locally

> **Important**: This app uses an embedded SQLite database (`better-sqlite3`). SQLite writes to the local filesystem and will not persist on serverless platforms (e.g., Vercel). The app is intended to run locally or on a stateful container/VM.

### Prerequisites
- Node.js version 22+ (configured in `.nvmrc` and `engines` field in `package.json`).

### Steps

```bash
# 1. Use supported Node version
nvm use 22

# 2. Install dependencies
npm install

# 3. Run test suite (13 Vitest tests verifying all matching & privacy rules)
npm test

# 4. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your mobile browser or desktop browser (responsive mobile-first viewport).

---

## Tradeoffs & Design Decisions

| Decision | Tradeoff | Rationale |
|---|---|---|
| **SQLite (`better-sqlite3`)** | Local-file storage; cannot scale horizontally across serverless workers. | Zero infrastructure overhead, synchronous C++ bindings, ACID transactions for atomic mutual match creation, perfect for local demo and evaluation. |
| **Optimistic UI with Rollback** | Client displays swipe animation before API resolves; network errors require card restoration. | Produces the snappy, fluid 60fps swipe feel expected of modern consumer apps. On failure, card returns to the top of the deck and a toast informs the user. |
| **Transactional Match Writing** | Synchronous query to check if target liked `"me"`. | Guarantees instant match modal feedback without polling or WebSockets. |
| **Deterministic Seed Shuffle** | Requires persisting a seed in SQLite metadata. | Fully eliminates any bias or position-based timing leak that could reveal who liked `"me"`, while ensuring reload stability. |

---

## Known Limitations

- **Swiping right on every profile reveals who liked you**: Because a match only appears for profiles that liked you back, a malicious user could blindly like all candidates to learn the full set of admirers. A production app must enforce daily swipe quotas or rate limits to mitigate this probing vector.
- **Public demo reset endpoint (`/api/reset`)**: The reset endpoint is unauthenticated for demo convenience. Production would remove or gate this behind administrator permissions.
- **Shared single-user identity in live demo**: The live demo uses a single shared `"me"` user session. Concurrent visitors share the same swipe history and match state; use the **"Reset demo"** button to restore the initial evaluation state at any time.
- **Ephemeral SQLite storage on free tier**: On Render's free tier, the local SQLite database is hosted on an ephemeral filesystem, meaning data resets to the initial seed state whenever the service restarts or redeploys.

---

## Next Steps for Production

1. **Authentication & Multi-Tenancy**:
   - Replace the `"me"` hardcoded ID with secure JWT / session authentication (NextAuth / Supabase / Auth0).
2. **Real-time Match Notifications**:
   - Implement WebSockets / Server-Sent Events (SSE) so users receive live match alerts if another user likes them while they are active on the app.
3. **Cursor-based Pagination**:
   - Replace full feed retrieval with cursor-based chunking (`LIMIT 20 WHERE id > :cursor`) to scale candidate feeds to millions of profiles.
4. **Rate Limiting & Abuse Prevention**:
   - Daily swipe caps (e.g. 50 likes per day) with Redis / token bucket algorithm to deter spam swiping.
5. **Trust & Safety**:
   - In-app reporting and blocking with instant removal from both feed and matches.
