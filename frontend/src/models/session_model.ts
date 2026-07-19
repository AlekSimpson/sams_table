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
  active_map_id: string | null
}

interface SessionActions {
  set_session: (token: string, claims: JWTClaims, user: User) => void
  clear_session: () => void
  // Applies the result of session_api.join(code) — see session_viewmodel.ts's join_code_model.
  set_campaign_session: (campaign_id: string, active_map_id: string | null) => void
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
      active_map_id: null,

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
          active_map_id: null,
        }),

      set_campaign_session: (campaign_id, active_map_id) => set({ campaign_id, active_map_id }),
    }),
    { name: 'sams-table-session' }
  )
)
