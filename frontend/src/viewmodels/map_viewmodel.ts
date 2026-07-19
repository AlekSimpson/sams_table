// VIEWMODEL layer — map/tile logic. The only map-related import Views need.
import { useCallback } from 'react'
import { map_model } from '../models/map_model'
import { map_api } from '../util/rest_client'
import { websocket_hook } from '../util/websockets'
import { MapTile } from '../types/game_types'
import { MapActivatedPayload } from '../types/websocket_types'

export function map_viewmodel() {
  const { tiles, tokens, mode, selected_asset_id, active_map_id, set_mode, set_selected_asset, place_tile, remove_tile, sync_tiles } = map_model()
  const { send } = websocket_hook()

  /** DM: broadcast map_activated, triggering a full tile sync for all clients. */
  const activate_map = useCallback(
    async (map_ID: string) => {
      const tiles = await map_api.getTiles(map_ID)
      send<MapActivatedPayload>('map_activated', { map_id: map_ID, tiles })
    },
    [send]
  )

  /** DM: place a tile and broadcast to the room. */
  const place_map_tile = useCallback(
    (tile: Omit<MapTile, 'id' | 'map_id'>) => {
      // TODO: send map_tile_placed WS event; server persists + broadcasts
      void tile
      void send
    },
    [send]
  )

  /** DM: remove a tile and broadcast to the room. */
  const remove_map_tile = useCallback(
    (tile_ID: string) => {
      // TODO: send map_tile_removed WS event
      void tile_ID
      void send
    },
    [send]
  )

  /** Load map tiles from REST (used on initial page load before any WS sync). */
  const load_map = useCallback(
    async (map_ID: string) => {
      const tiles = await map_api.getTiles(map_ID)
      sync_tiles(tiles)
    },
    [sync_tiles]
  )

  return {
    tiles,
    tokens,
    mode,
    selected_asset_id,
    active_map_id,
    set_mode,
    set_selected_asset,
    place_tile,
    remove_tile,
    activate_map,
    place_map_tile,
    remove_map_tile,
    load_map,
  }
}
