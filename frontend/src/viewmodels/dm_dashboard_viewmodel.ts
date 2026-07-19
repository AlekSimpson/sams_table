// VIEWMODEL layer — DM dashboard logic. The only DM-dashboard-related import Views need.
import { useCallback } from 'react'
import { dm_dashboard_model } from '../models/dm_dashboard_model'
import { campaign_api, session_api } from '../util/rest_client'

export function dm_dashboard_viewmodel() {
  const {
    selected_campaign,
    session,
    active_map_id,
    joined_players,
    set_selected_campaign,
    set_session,
    set_active_map_id: set_active_map,
    add_joined_player,
    remove_joined_player,
  } = dm_dashboard_model()

  const select_campaign = useCallback(
    async (campaign_id: string) => {
      const campaign = await campaign_api.get(campaign_id)
      set_selected_campaign(campaign)
    },
    [set_selected_campaign]
  )

  const start_session = useCallback(async () => {
    const current_campaign = dm_dashboard_model.getState().selected_campaign
    if (!current_campaign) return
    const started_session = await session_api.start(current_campaign.id)
    set_session(started_session)
  }, [set_session])

  const end_session = () => set_session(null)

  return {
    selected_campaign,
    session,
    active_map_id,
    joined_players,
    select_campaign,
    start_session,
    end_session,
    set_active_map,
    add_joined_player,
    remove_joined_player,
  }
}
