// MODEL layer — raw map/tile state. Views must not import this directly; use map_viewmodel instead.
import { create } from 'zustand'
import { MapTile } from '../types/game_types'
import { Token } from '../types/game_types'

export type MapMode = 'view' | 'build'

interface MapState {
  active_map_id: string | null
  tiles: MapTile[]
  tokens: Token[]
  selected_asset_id: string | null
  mode: MapMode
  // True while the initial REST tile load for active_map_id is in flight.
  // Read by websockets.ts to avoid applying map_tile_placed/map_tile_removed
  // events on top of a not-yet-loaded tile list (see load_map in map_viewmodel.ts).
  tiles_loading: boolean
}

interface MapActions {
  set_active_map: (mapID: string | null, tiles: MapTile[]) => void
  set_mode: (mode: MapMode) => void
  set_selected_asset: (assetID: string | null) => void
  place_tile: (tile: MapTile) => void
  remove_tile: (tileID: string) => void
  move_token: (tokenID: string, gridX: number, gridY: number) => void
  set_tokens: (tokens: Token[]) => void
  sync_tiles: (tiles: MapTile[]) => void
  set_tiles_loading: (loading: boolean) => void
  reset: () => void
}

type MapModel = MapState & MapActions

export const map_model = create<MapModel>()((set) => ({
  active_map_id: null,
  tiles: [],
  tokens: [],
  selected_asset_id: null,
  mode: 'view',
  tiles_loading: false,

  set_active_map: (map_ID, tiles) => set({ active_map_id: map_ID, tiles }),

  set_mode: (mode) => set({ mode }),

  set_selected_asset: (asset_ID) => set({ selected_asset_id: asset_ID }),

  place_tile: (tile) =>
    set((state) => ({
      tiles: [
        ...state.tiles.filter(
          (t) => !(t.grid_x === tile.grid_x && t.grid_y === tile.grid_y && t.grid_z === tile.grid_z)
        ),
        tile,
      ],
    })),

  remove_tile: (tileID) =>
    set((state) => ({ tiles: state.tiles.filter((t) => t.id !== tileID) })),

  move_token: (tokenID, gridX, gridY) =>
    set((state) => ({
      tokens: state.tokens.map((t) =>
        t.id === tokenID ? { ...t, grid_x: gridX, grid_y: gridY } : t
      ),
    })),

  set_tokens: (tokens) => set({ tokens }),

  sync_tiles: (tiles) => set({ tiles }),

  set_tiles_loading: (loading) => set({ tiles_loading: loading }),

  reset: () => set({
    active_map_id: null,
    tiles: [],
    tokens: [],
    selected_asset_id: null,
    mode: 'view',
    tiles_loading: false,
  }),
}))
