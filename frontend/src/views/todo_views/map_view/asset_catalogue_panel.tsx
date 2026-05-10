// VIEW layer — DOM overlay panel for selecting tiles to place (builder mode)
import { map_viewmodel } from '../../../viewmodels/map_viewmodel'

const DEFAULT_ASSETS = [
  'floor_1x1', 'floor_2x2',
  'wall_1x1', 'wall_corner', 'wall_door',
  'pillar_1x1', 'stair_1x1',
  'elevation_1x1', 'elevation_2x1',
]

export default function AssetCatalogPanel() {
  const { selected_asset_id, set_selected_asset } = map_viewmodel()
  return (
    <div style={{ position: 'absolute', top: 16, left: 16, background: '#222', padding: 12, borderRadius: 8 }}>
      <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Assets</div>
      {DEFAULT_ASSETS.map((id) => (
        <div
          key={id}
          onClick={() => set_selected_asset(id)}
          style={{
            padding: '4px 8px',
            cursor: 'pointer',
            background: selected_asset_id === id ? '#4a4aaa' : 'transparent',
            borderRadius: 4,
            fontSize: 12,
            marginBottom: 2,
          }}
        >
          {id}
        </div>
      ))}
    </div>
  )
}
