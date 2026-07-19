// MODEL layer — raw DM dashboard state. Views must not import this directly; use dm_dashboard_viewmodel instead.
import { create } from 'zustand'
import { DNDCampaign } from '../types/dnd_types'
import { JoinedPlayer, SessionStartResponse } from '../types/app_types'

interface DmDashboardState {
  campaigns: DNDCampaign[]
  selected_campaign: DNDCampaign | null
  session: SessionStartResponse | null
  active_map_id: string | null
  joined_players: JoinedPlayer[]
}

interface DmDashboardActions {
  set_campaigns: (campaigns: DNDCampaign[]) => void
  add_campaign: (campaign: DNDCampaign) => void
  set_selected_campaign: (campaign: DNDCampaign | null) => void
  set_session: (session: SessionStartResponse | null) => void
  set_active_map_id: (map_id: string | null) => void
  add_joined_player: (player: JoinedPlayer) => void
  remove_joined_player: (user_id: string) => void
  clear_joined_players: () => void
}

type DmDashboardModel = DmDashboardState & DmDashboardActions

export const dm_dashboard_model = create<DmDashboardModel>()((set) => ({
  campaigns: [],
  selected_campaign: null,
  session: null,
  active_map_id: null,
  joined_players: [],

  set_campaigns: (campaigns) => set({ campaigns }),

  add_campaign: (campaign) => set((state) => ({ campaigns: [...state.campaigns, campaign] })),

  set_selected_campaign: (campaign) => set({ selected_campaign: campaign }),

  set_session: (session) => set({ session }),

  set_active_map_id: (map_id) => set({ active_map_id: map_id }),

  add_joined_player: (player) =>
    set((state) => {
      if (state.joined_players.some((joined_player) => joined_player.user_id === player.user_id)) return state
      return { joined_players: [...state.joined_players, player] }
    }),

  remove_joined_player: (user_id) =>
    set((state) => ({
      joined_players: state.joined_players.filter((joined_player) => joined_player.user_id !== user_id),
    })),

  clear_joined_players: () => set({ joined_players: [] }),
}))
