export interface User {
  id: string
  username: string
  created_at: string
}

export type Role = 'dm' | 'player'

export type Tab = 'combat' | 'spells' | 'equipment' | 'features' | 'notes'

export type PlayerDashboardParameters = { character_id: string }

export type DashboardTab = 'sheet' | 'map'

export type DmDashboardTab = 'campaigns' | 'maps' | 'characters'

export type CampaignDetailTab = 'characters' | 'maps'

export interface CharacterSheetProps {
  character_id: string
}

export interface JWTClaims {
  user_id: string
  campaign_id: string
  role: Role
  character_id?: string
  expiration_time: number
  issued_at: number
}

export interface AuthResponse {
  token: string
  user: User
}

export interface SessionStartResponse {
  join_code: string
}

export interface SessionJoinResponse {
  campaign_id: string
  active_map_id: string | null
}