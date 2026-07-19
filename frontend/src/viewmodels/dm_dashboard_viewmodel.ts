// VIEWMODEL layer — DM dashboard logic. The only DM-dashboard-related import Views need.
import { useCallback, useState } from 'react'
import { dm_dashboard_model } from '../models/dm_dashboard_model'
import { campaign_api, character_api, permission_api, session_api } from '../util/rest_client'
import { CampaignDetailTab, DmDashboardTab } from '../types/app_types'
import { CampaignPermissionEntry, DNDCampaign, DNDCharacter } from '../types/dnd_types'
import { GameMap } from '../types/game_types'

export function dm_dashboard_viewmodel() {
  const {
    campaigns,
    selected_campaign,
    session,
    active_map_id,
    joined_players,
    set_campaigns,
    add_campaign,
    set_selected_campaign,
    set_session,
    set_active_map_id: set_active_map,
    add_joined_player,
    remove_joined_player,
    clear_joined_players,
  } = dm_dashboard_model()

  const load_campaigns = useCallback(async () => {
    const loaded_campaigns = await campaign_api.list()
    set_campaigns(loaded_campaigns)
  }, [set_campaigns])

  const create_campaign = useCallback(
    async (name: string, description?: string) => {
      const new_campaign = await campaign_api.create(name, description)
      add_campaign(new_campaign)
    },
    [add_campaign]
  )

  const select_campaign = useCallback(
    async (campaign_id: string) => {
      const campaign = await campaign_api.get(campaign_id)
      set_selected_campaign(campaign)
    },
    [set_selected_campaign]
  )

  const deselect_campaign = useCallback(() => set_selected_campaign(null), [set_selected_campaign])

  const start_session = useCallback(async () => {
    const current_campaign = dm_dashboard_model.getState().selected_campaign
    if (!current_campaign) return
    const started_session = await session_api.start(current_campaign.id)
    set_session(started_session)
  }, [set_session])

  const end_session = useCallback(async () => {
    const current_campaign = dm_dashboard_model.getState().selected_campaign
    if (!current_campaign) return
    await session_api.end(current_campaign.id)
    set_session(null)
    clear_joined_players()
  }, [set_session, clear_joined_players])

  function dm_dashboard_shell_model() {
    const [current_tab, set_current_tab] = useState<DmDashboardTab>('campaigns')

    const on_campaigns_tab_press = () => set_current_tab('campaigns')
    const on_maps_tab_press = () => set_current_tab('maps')
    const on_characters_tab_press = () => set_current_tab('characters')

    return {
      current_tab,
      on_campaigns_tab_press,
      on_maps_tab_press,
      on_characters_tab_press,
    }
  }

  function campaign_list_panel_model() {
    const [name, set_name] = useState('')
    const [description, set_description] = useState('')

    const on_name_change = (event: React.ChangeEvent<HTMLInputElement>) => set_name(event.target.value)
    const on_description_change = (event: React.ChangeEvent<HTMLTextAreaElement>) => set_description(event.target.value)

    const on_create_press = () => {
      if (!name.trim()) return
      create_campaign(name.trim(), description.trim() || undefined)
      set_name('')
      set_description('')
    }

    const on_back_press = () => deselect_campaign()

    return {
      name,
      description,
      on_name_change,
      on_description_change,
      on_create_press,
      on_back_press,
    }
  }

  function campaign_card_model(campaign: DNDCampaign) {
    const on_card_click = () => select_campaign(campaign.id)
    return { on_card_click }
  }

  function campaign_detail_panel_model(campaign_id: string) {
    const [current_tab, set_current_tab] = useState<CampaignDetailTab>('characters')
    const [characters, set_characters] = useState<DNDCharacter[]>([])
    const [maps, set_maps] = useState<GameMap[]>([])

    const on_characters_tab_press = () => set_current_tab('characters')
    const on_maps_tab_press = () => set_current_tab('maps')

    const load_characters = useCallback(async () => {
      const loaded_characters = await character_api.list_characters_in_campaign(campaign_id)
      set_characters(loaded_characters)
    }, [campaign_id])

    const load_maps = useCallback(async () => {
      const loaded_maps = await campaign_api.list_maps(campaign_id)
      set_maps(loaded_maps)
    }, [campaign_id])

    return {
      current_tab,
      characters,
      maps,
      on_characters_tab_press,
      on_maps_tab_press,
      load_characters,
      load_maps,
    }
  }

  /** In-session TopBar controls: copy-to-clipboard state for the join code. */
  function session_controls_model(join_code: string) {
    const [copied, set_copied] = useState(false)

    const on_copy_press = async () => {
      await navigator.clipboard.writeText(join_code)
      set_copied(true)
      setTimeout(() => set_copied(false), 1500)
    }

    return { copied, on_copy_press }
  }

  /** In-session map dropdown: list of maps for the active campaign. */
  function map_selector_model(campaign_id: string) {
    const [maps, set_maps] = useState<GameMap[]>([])

    const load_maps = useCallback(async () => {
      const loaded_maps = await campaign_api.list_maps(campaign_id)
      set_maps(loaded_maps)
    }, [campaign_id])

    return { maps, load_maps }
  }

  /** In-session Permissions panel: load each player's map permissions and persist
   *  per-toggle edits immediately (optimistic update), mirroring dm_combat_controls_panel's
   *  "toggle button, immediate persist" pattern. */
  function permission_panel_model(campaign_id: string) {
    const [permissions_by_user_id, set_permissions_by_user_id] = useState<Record<string, CampaignPermissionEntry>>({})

    const load_permissions = useCallback(async () => {
      const loaded_permissions = await permission_api.get(campaign_id)
      const loaded_permissions_by_user_id: Record<string, CampaignPermissionEntry> = {}
      for (const entry of loaded_permissions) {
        loaded_permissions_by_user_id[entry.user_id] = entry
      }
      set_permissions_by_user_id(loaded_permissions_by_user_id)
    }, [campaign_id])

    /** A newly-joined player may not have a permission record yet — default to off. */
    const get_player_permissions = (user_id: string): CampaignPermissionEntry =>
      permissions_by_user_id[user_id] ?? { user_id, can_move_tokens: false, can_place_tiles: false }

    const toggle_permission = useCallback(
      async (user_id: string, permission_field: 'can_move_tokens' | 'can_place_tiles') => {
        const current_permissions = permissions_by_user_id[user_id] ?? {
          user_id,
          can_move_tokens: false,
          can_place_tiles: false,
        }
        const updated_permissions: CampaignPermissionEntry = {
          ...current_permissions,
          [permission_field]: !current_permissions[permission_field],
        }
        set_permissions_by_user_id((existing) => ({ ...existing, [user_id]: updated_permissions }))
        await permission_api.set(campaign_id, user_id, {
          can_move_tokens: updated_permissions.can_move_tokens,
          can_place_tiles: updated_permissions.can_place_tiles,
        })
      },
      [campaign_id, permissions_by_user_id]
    )

    return { get_player_permissions, load_permissions, toggle_permission }
  }

  return {
    campaigns,
    selected_campaign,
    session,
    active_map_id,
    joined_players,
    load_campaigns,
    select_campaign,
    start_session,
    end_session,
    set_active_map,
    add_joined_player,
    remove_joined_player,
    dm_dashboard_shell_model,
    campaign_list_panel_model,
    campaign_card_model,
    campaign_detail_panel_model,
    session_controls_model,
    map_selector_model,
    permission_panel_model,
  }
}
