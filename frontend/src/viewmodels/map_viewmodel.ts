// VIEWMODEL layer — map/tile logic. The only map-related import Views need.
import { useCallback, useState } from 'react'
import { map_model } from '../models/map_model'
import { map_api, permission_api } from '../util/rest_client'
import { websocket_hook } from '../util/websockets'
import { MapTile } from '../types/game_types'
import { CampaignPermissionEntry } from '../types/dnd_types'
import { MapActivatedPayload, TokenMovedPayload } from '../types/websocket_types'

export function map_viewmodel() {
  const { tiles, tokens, mode, selected_asset_id, active_map_id, tiles_loading, set_mode, set_selected_asset, place_tile, remove_tile, move_token: move_token_in_store, set_active_map, set_tokens, set_tiles_loading } = map_model()
  const { send } = websocket_hook()
  const [tiles_error, set_tiles_error] = useState<string | null>(null)
  const [permissions, set_permissions] = useState<CampaignPermissionEntry[]>([])

  /** DM: broadcast map_activated, triggering a full tile sync for all clients.
   *  Pass null to hide the map from players (broadcasts an empty snapshot). */
  const activate_map = useCallback(
    async (map_ID: string | null) => {
      const tiles = map_ID ? await map_api.getTiles(map_ID) : []
      send<MapActivatedPayload>('map_activated', { map_id: map_ID, tiles })
    },
    [send]
  )

  /** DM: place a tile in the builder and persist the full tile list via REST. */
  const place_map_tile = useCallback(
    async (map_ID: string, tile: Omit<MapTile, 'id' | 'map_id'>) => {
      const placed_tile: MapTile = { ...tile, id: crypto.randomUUID(), map_id: map_ID }
      place_tile(placed_tile)
      set_tiles_error(null)
      try {
        await map_api.putTiles(map_ID, map_model.getState().tiles)
      } catch (err) {
        set_tiles_error(err instanceof Error ? err.message : 'Failed to save map tiles')
      }
    },
    [place_tile]
  )

  /** DM: remove a tile in the builder and persist the full tile list via REST. */
  const remove_map_tile = useCallback(
    async (map_ID: string, tile_ID: string) => {
      remove_tile(tile_ID)
      set_tiles_error(null)
      try {
        await map_api.putTiles(map_ID, map_model.getState().tiles)
      } catch (err) {
        set_tiles_error(err instanceof Error ? err.message : 'Failed to save map tiles')
      }
    },
    [remove_tile]
  )

  /** Load map tiles + tokens from REST (used on initial page load before any WS sync). */
  const load_map = useCallback(
    async (map_ID: string) => {
      set_tiles_loading(true)
      set_tiles_error(null)
      try {
        const [tiles, loaded_tokens] = await Promise.all([map_api.getTiles(map_ID), map_api.getTokens(map_ID)])
        // A map_activated WS event may have switched the active map while this
        // request was in flight; if so, this response is stale — drop it instead
        // of clobbering the newer map's tiles. See websockets.ts's map_activated
        // handling for the other half of this race.
        const current_active_map_id = map_model.getState().active_map_id
        if (current_active_map_id === null || current_active_map_id === map_ID) {
          set_active_map(map_ID, tiles)
          set_tokens(loaded_tokens)
        }
      } catch (err) {
        set_tiles_error(err instanceof Error ? err.message : 'Failed to load map tiles')
      } finally {
        set_tiles_loading(false)
      }
    },
    [set_active_map, set_tokens, set_tiles_loading]
  )

  /** Move a token: optimistic local update first, then broadcast over WS. */
  const move_token = useCallback(
    (token_id: string, character_id: string, grid_x: number, grid_y: number) => {
      move_token_in_store(token_id, grid_x, grid_y)
      send<TokenMovedPayload>('token_moved', { token_id, character_id, grid_x, grid_y })
    },
    [move_token_in_store, send]
  )

  /** Load per-player campaign permissions (e.g. can_move_tokens) for gating token drag. */
  const load_permissions = useCallback(
    async (campaign_id: string) => {
      const loaded_permissions = await permission_api.get(campaign_id)
      set_permissions(loaded_permissions)
    },
    []
  )

  return {
    tiles,
    tokens,
    mode,
    selected_asset_id,
    active_map_id,
    tiles_loading,
    tiles_error,
    permissions,
    set_mode,
    set_selected_asset,
    place_tile,
    remove_tile,
    activate_map,
    place_map_tile,
    remove_map_tile,
    load_map,
    move_token,
    load_permissions,
  }
}
