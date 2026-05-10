// MODEL layer — raw session state. Views must not import this directly; use session_viewmodel instead.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Role, User, JWTClaims } from '../types/app_types'

interface SessionState {
  token: string | null
  user: User | null
  role: Role | null
  campaign_id: string | null
  character_id: string | null
}

interface SessionActions {
  set_session: (token: string, claims: JWTClaims, user: User) => void
  clear_session: () => void
}

type SessionModel = SessionState & SessionActions

export const session_model = create<SessionModel>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      role: null,
      campaign_id: null,
      character_id: null,

      set_session: (token, claims, user) =>
        set({
          token,
          user,
          role: claims.role,
          campaign_id: claims.campaign_id,
          character_id: claims.character_id ?? null,
        }),

      clear_session: () =>
        set({
          token: null,
          user: null,
          role: null,
          campaign_id: null,
          character_id: null,
        }),
    }),
    { name: 'sams-table-session' }
  )
)
