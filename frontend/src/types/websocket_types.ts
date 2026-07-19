import { MapTile } from '../types/game_types'

export type WSEventType =
  | 'hp_update'
  | 'map_activated'
  | 'map_tile_placed'
  | 'map_tile_removed'
  | 'token_moved'
  | 'dice_roll_request'
  | 'dice_roll_result'
  | 'initiative_update'
  | 'visibility_toggle'
  | 'condition_update'

export interface WSEnvelope<T = unknown> {
  type: WSEventType
  campaign_id: string
  sender_id: string
  payload: T
  ts: number
}

export interface HPUpdatePayload {
  character_id: string
  current_hp: number
  max_hp: number
}

export interface MapActivatedPayload {
  map_id: string
  tiles: MapTile[]
}

export interface MapTilePlacedPayload {
  tile_id: string
  asset_id: string
  asset_source: 'default' | 'uploaded'
  grid_x: number
  grid_y: number
  grid_z: number
  rotation_y: number
}

export interface MapTileRemovedPayload {
  tile_id: string
}

export interface TokenMovedPayload {
  token_id: string
  character_id: string
  grid_x: number
  grid_y: number
}

export interface DiceRollRequestPayload {
  notation: string
  character_id: string
  roller_name: string
}

export interface DiceRollResultPayload {
  roller_id: string
  roller_name: string
  dice: string
  results: number[]
  total: number
}

export interface InitiativeEntry {
  character_id: string
  name: string
  initiative: number
  is_npc: boolean
}

export interface InitiativeUpdatePayload {
  ordered_entries: InitiativeEntry[]
}

export interface VisibilityTogglePayload {
  target_player_id: string
  visible: boolean
}

export interface ConditionUpdatePayload {
  character_id: string
  conditions: string[]
}
