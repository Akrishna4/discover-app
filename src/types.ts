export interface Profile {
  id: string
  name: string
  age: number
  photo: string
  bio: string
  location: string
  interests: string[]
}

export type SwipeAction = 'like' | 'pass'

export interface SwipeRequest {
  profileId: string
  action: SwipeAction
}

export interface SwipeResponse {
  matched: boolean
  profile?: Profile
}

export interface Match {
  profile: Profile
  matchedAt: string
}
