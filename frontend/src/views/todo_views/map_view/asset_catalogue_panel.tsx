// VIEW layer — DOM overlay panel for selecting tiles to place (builder mode)
import { useEffect, useState } from 'react'
import { map_viewmodel } from '../../../viewmodels/map_viewmodel'
import { asset_viewmodel } from '../../../viewmodels/asset_viewmodel'
import AssetUploadForm from '../../asset_upload_form'
import { Badge, Button, Card } from '../../components'
import '../../../../styles/asset_catalogue_panel.css'

const DEFAULT_ASSETS = [
  'floor_1x1', 'floor_2x2',
  'wall_1x1', 'wall_corner', 'wall_door',
  'pillar_1x1', 'stair_1x1',
  'elevation_1x1', 'elevation_2x1',
]

type AssetTypeFilter = 'all' | 'map_tile' | 'mini'

interface AssetCatalogPanelProps {
  campaign_id: string
}

export default function AssetCatalogPanel({ campaign_id }: AssetCatalogPanelProps) {
  const { selected_asset, set_selected_asset } = map_viewmodel()
  const { uploaded_assets, list_campaign_assets } = asset_viewmodel()
  const [asset_type_filter, set_asset_type_filter] = useState<AssetTypeFilter>('all')
  const [is_upload_form_visible, set_is_upload_form_visible] = useState(false)

  useEffect(() => {
    list_campaign_assets(campaign_id)
  }, [campaign_id, list_campaign_assets])

  const filtered_assets = uploaded_assets.filter(
    (asset) => asset_type_filter === 'all' || asset.asset_type === asset_type_filter
  )

  const on_upload_toggle_press = () => set_is_upload_form_visible((visible) => !visible)

  return (
    <div className="asset-catalogue-panel">
      <div className="asset-catalogue-panel__header">
        <span className="section-label">Assets</span>
        <Button variant="ghost" size="small" onClick={on_upload_toggle_press}>
          {is_upload_form_visible ? 'Close' : 'Upload New Asset'}
        </Button>
      </div>

      {is_upload_form_visible && (
        <AssetUploadForm campaign_id={campaign_id} on_upload_success={() => list_campaign_assets(campaign_id)} />
      )}

      <div className="asset-catalogue-panel__section">
        <span className="section-label">Default Tiles</span>
        <div className="asset-catalogue-panel__default-tiles">
          {DEFAULT_ASSETS.map((id) => (
            <Button
              key={id}
              variant={selected_asset?.id === id ? 'secondary' : 'ghost'}
              size="small"
              onClick={() => set_selected_asset({ id, source: 'default' })}
            >
              {id}
            </Button>
          ))}
        </div>
      </div>

      <div className="asset-catalogue-panel__section">
        <span className="section-label">Campaign Assets</span>
        <div className="asset-catalogue-panel__filter-group">
          <Button
            variant={asset_type_filter === 'all' ? 'secondary' : 'ghost'}
            size="small"
            onClick={() => set_asset_type_filter('all')}
          >
            All
          </Button>
          <Button
            variant={asset_type_filter === 'map_tile' ? 'secondary' : 'ghost'}
            size="small"
            onClick={() => set_asset_type_filter('map_tile')}
          >
            Map Tile
          </Button>
          <Button
            variant={asset_type_filter === 'mini' ? 'secondary' : 'ghost'}
            size="small"
            onClick={() => set_asset_type_filter('mini')}
          >
            Mini
          </Button>
        </div>

        {filtered_assets.length === 0 ? (
          <div className="asset-catalogue-panel__empty">No uploaded assets yet.</div>
        ) : (
          <div className="asset-catalogue-panel__grid">
            {filtered_assets.map((asset) => (
              <Card
                key={asset.id}
                className={`asset-card${selected_asset?.id === asset.id ? ' asset-card--selected' : ''}`}
                onClick={() => set_selected_asset({ id: asset.id, source: 'uploaded' })}
              >
                <div className="asset-card__thumbnail" aria-hidden="true">No preview</div>
                <div className="asset-card__label">{asset.label}</div>
                <Badge variant={asset.asset_type === 'mini' ? 'info' : 'neutral'}>
                  {asset.asset_type === 'map_tile' ? 'Map Tile' : 'Mini'}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
