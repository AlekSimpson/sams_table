// VIEW layer — DM map builder (tile placement, asset upload)
//import { map_viewmodel } from '../viewmodels/map_viewmodel'
//import { asset_viewmodel } from '../viewmodels/asset_viewmodel'
import { useParams } from 'react-router-dom'
import MapScene from './map_view/map_view'
import AssetCatalogPanel from './map_view/asset_catalogue_panel'

export default function MapBuilder() {
  const { map_id } = useParams()

  if (!map_id) {
    return <div style={{ padding: 24 }}>No map selected.</div>
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <MapScene mode="build" map_id={map_id} />
      <AssetCatalogPanel />
    </div>
  )
}
