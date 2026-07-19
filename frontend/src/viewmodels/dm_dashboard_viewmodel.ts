// VIEWMODEL layer — DM dashboard logic. The only DM-dashboard-related import Views need.
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dm_dashboard_model } from '../models/dm_dashboard_model'
import { campaign_api, character_api, map_api, permission_api, session_api } from '../util/rest_client'
import { CampaignDetailTab } from '../types/app_types'
import { CampaignPermissionEntry, DNDCharacter } from '../types/dnd_types'
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
  const navigate = useNavigate()

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

  /** Sidebar's campaign folder list: "+ New Campaign" create-form state (see dm_dashboard.tsx's
   *  Modal), plus the campaigns themselves and selection come straight off this hook's own
   *  `campaigns`/`selected_campaign`/`select_campaign`. */
  function campaign_sidebar_model() {
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

    return {
      name,
      description,
      on_name_change,
      on_description_change,
      on_create_press,
    }
  }

  function campaign_detail_panel_model(campaign_id: string) {
    const [current_tab, set_current_tab] = useState<CampaignDetailTab>('characters')
    const [characters, set_characters] = useState<DNDCharacter[]>([])
    const [maps, set_maps] = useState<GameMap[]>([])
    const [new_map_name, set_new_map_name] = useState('')
    const [new_map_grid_width_draft, set_new_map_grid_width_draft] = useState('30')
    const [new_map_grid_height_draft, set_new_map_grid_height_draft] = useState('30')
    const [new_map_validation_error, set_new_map_validation_error] = useState<string | null>(null)
    const [is_creating_map, set_is_creating_map] = useState(false)
    const [selected_character_id, set_selected_character_id] = useState<string | null>(null)
    const [selected_map_id, set_selected_map_id] = useState<string | null>(null)

    const on_characters_tab_press = () => set_current_tab('characters')
    const on_maps_tab_press = () => set_current_tab('maps')
    const on_character_select = (character_id: string) => set_selected_character_id(character_id)
    const on_back_to_characters_press = () => set_selected_character_id(null)
    const on_map_select = (map_id: string) => set_selected_map_id(map_id)
    const on_back_to_maps_press = () => set_selected_map_id(null)

    // Clearing the drilled-into character/map selection is tied directly to campaign_id
    // itself — synchronously, on every genuine campaign change — rather than to
    // load_characters'/load_maps' async resolution. Those calls can be in flight for a
    // while (network/mock latency), and CampaignDetailPanel's mount effect runs under
    // StrictMode's dev-mode double effect invocation, so two overlapping load calls for
    // the SAME campaign_id can be in flight at once. Clearing selection from inside
    // that async path let a slow/duplicate call wipe out a selection the user made in
    // the meantime (and, for a real campaign switch, left a fetch-duration window
    // where the OLD campaign's data stayed visible under the NEW campaign's header).
    // This effect fires immediately on the actual campaign_id change, independent of
    // any network call.
    useEffect(() => {
      set_selected_character_id(null)
      set_selected_map_id(null)
    }, [campaign_id])

    const load_characters = useCallback(async () => {
      const loaded_characters = await character_api.list_characters_in_campaign(campaign_id)
      set_characters(loaded_characters)
    }, [campaign_id])

    const load_maps = useCallback(async () => {
      const loaded_maps = await campaign_api.list_maps(campaign_id)
      set_maps(loaded_maps)
    }, [campaign_id])

    const on_new_map_name_change = (event: React.ChangeEvent<HTMLInputElement>) => {
      set_new_map_name(event.target.value)
      if (new_map_validation_error) set_new_map_validation_error(null)
    }

    const on_new_map_grid_width_change = (event: React.ChangeEvent<HTMLInputElement>) => {
      set_new_map_grid_width_draft(event.target.value)
      if (new_map_validation_error) set_new_map_validation_error(null)
    }

    const on_new_map_grid_height_change = (event: React.ChangeEvent<HTMLInputElement>) => {
      set_new_map_grid_height_draft(event.target.value)
      if (new_map_validation_error) set_new_map_validation_error(null)
    }

    const on_create_map_press = async () => {
      const trimmed_name = new_map_name.trim()
      if (!trimmed_name) return

      const grid_width = Number(new_map_grid_width_draft)
      const grid_height = Number(new_map_grid_height_draft)
      const is_positive_integer = (value: number) => Number.isInteger(value) && value > 0

      if (!is_positive_integer(grid_width) || !is_positive_integer(grid_height)) {
        set_new_map_validation_error('Grid width and height must be positive whole numbers')
        return
      }

      set_new_map_validation_error(null)
      set_is_creating_map(true)
      try {
        const new_map = await map_api.create(campaign_id, trimmed_name, grid_width, grid_height)
        set_maps((existing_maps) => [...existing_maps, new_map])
        navigate(`/dm/map-builder/${new_map.id}`)
      } finally {
        set_is_creating_map(false)
      }
    }

    return {
      current_tab,
      characters,
      maps,
      selected_character_id,
      selected_map_id,
      on_characters_tab_press,
      on_maps_tab_press,
      on_character_select,
      on_back_to_characters_press,
      on_map_select,
      on_back_to_maps_press,
      load_characters,
      load_maps,
      new_map_name,
      new_map_grid_width_draft,
      new_map_grid_height_draft,
      new_map_validation_error,
      is_creating_map,
      on_new_map_name_change,
      on_new_map_grid_width_change,
      on_new_map_grid_height_change,
      on_create_map_press,
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
    campaign_sidebar_model,
    campaign_detail_panel_model,
    session_controls_model,
    map_selector_model,
    permission_panel_model,
  }
}
