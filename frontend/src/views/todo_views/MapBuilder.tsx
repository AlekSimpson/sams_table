// VIEW layer — DM map builder (tile placement, asset upload)
//import { map_viewmodel } from '../viewmodels/map_viewmodel'
//import { asset_viewmodel } from '../viewmodels/asset_viewmodel'
import { useParams } from 'react-router-dom'
import MapScene from './map_view/map_view'

export default function MapBuilder() {
  const { map_id } = useParams()

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <MapScene mode="build" />
    </div>
  )
}
