// VIEWMODEL layer — map/tile logic. The only map-related import Views need.
import { useCallback, useState } from 'react'
import { map_model } from '../models/map_model'
import { map_api } from '../util/rest_client'
import { websocket_hook } from '../util/websockets'
import { MapTile } from '../types/game_types'
import { MapActivatedPayload } from '../types/websocket_types'

export function map_viewmodel() {
  const { tiles, tokens, mode, selected_asset_id, active_map_id, set_mode, set_selected_asset, place_tile, remove_tile, sync_tiles } = map_model()
  const { send } = websocket_hook()
  const [tiles_loading, set_tiles_loading] = useState(false)
  const [tiles_error, set_tiles_error] = useState<string | null>(null)

  /** DM: broadcast map_activated, triggering a full tile sync for all clients. */
  const activate_map = useCallback(
    async (map_ID: string) => {
      const tiles = await map_api.getTiles(map_ID)
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

  /** Load map tiles from REST (used on initial page load before any WS sync). */
  const load_map = useCallback(
    async (map_ID: string) => {
      set_tiles_loading(true)
      set_tiles_error(null)
      try {
        const tiles = await map_api.getTiles(map_ID)
        sync_tiles(tiles)
      } catch (err) {
        set_tiles_error(err instanceof Error ? err.message : 'Failed to load map tiles')
      } finally {
        set_tiles_loading(false)
      }
    },
    [sync_tiles]
  )

  return {
    tiles,
    tokens,
    mode,
    selected_asset_id,
    active_map_id,
    tiles_loading,
    tiles_error,
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
