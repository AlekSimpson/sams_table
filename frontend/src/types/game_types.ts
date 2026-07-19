export interface GameMap {
  id: string
  campaign_id: string
  name: string
  grid_width: number
  grid_height: number
  created_at: string
}

export interface MapTile {
  id: string
  map_id: string
  asset_id: string
  asset_source: 'default' | 'uploaded'
  grid_x: number
  grid_y: number
  grid_z: number
  rotation_y: number
}

export interface SelectedAsset {
  id: string
  source: MapTile['asset_source']
}

export interface Token {
  id: string
  character_id: string
  grid_x: number
  grid_y: number
}

export interface UploadedAsset {
  id: string
  campaign_id?: string
  uploaded_by: string
  label: string
  storage_path: string
  grid_width: number
  grid_depth: number
  scale_factor: number
  asset_type: 'map_tile' | 'mini'
  created_at: string
}