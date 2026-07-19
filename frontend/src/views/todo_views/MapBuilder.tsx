// VIEW layer — DM map builder (tile placement, asset upload)
//import { map_viewmodel } from '../viewmodels/map_viewmodel'
//import { asset_viewmodel } from '../viewmodels/asset_viewmodel'
import { useParams } from 'react-router-dom'
import { dm_dashboard_viewmodel } from '../../viewmodels/dm_dashboard_viewmodel'
import MapScene from './map_view/map_view'
import AssetCatalogPanel from './map_view/asset_catalogue_panel'

export default function MapBuilder() {
  const { map_id } = useParams()
  // Reached from the campaign detail Maps tab / map creation flow, both of which run
  // only after a campaign is selected — selected_campaign is still set in the shared
  // dashboard store when this route mounts.
  const { selected_campaign } = dm_dashboard_viewmodel()

  if (!map_id) {
    return <div style={{ padding: 24 }}>No map selected.</div>
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <MapScene mode="build" map_id={map_id} />
      {selected_campaign && <AssetCatalogPanel campaign_id={selected_campaign.id} />}
    </div>
  )
}
