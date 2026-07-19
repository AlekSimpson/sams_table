// VIEW layer — DM map builder (tile placement, asset upload)
//import { map_viewmodel } from '../viewmodels/map_viewmodel'
//import { asset_viewmodel } from '../viewmodels/asset_viewmodel'
import { useNavigate, useParams } from 'react-router-dom'
import { dm_dashboard_viewmodel } from '../viewmodels/dm_dashboard_viewmodel'
import { notification_viewmodel } from '../viewmodels/notification_viewmodel'
import MapScene from './todo_views/map_view/map_view'
import AssetCatalogPanel from './todo_views/map_view/asset_catalogue_panel'
import { Button, NotificationCenter, TopBar } from './components'
import '../../styles/map_builder.css'

export default function MapBuilder() {
  const { map_id } = useParams()
  const navigate = useNavigate()
  // Reached from the campaign detail Maps tab / map creation flow, both of which run
  // only after a campaign is selected — selected_campaign is still set in the shared
  // dashboard store when this route mounts, so navigating back to /dm lands the DM
  // straight back on that campaign's detail pane rather than a blank dashboard.
  const { selected_campaign } = dm_dashboard_viewmodel()
  const { notifications, remove_notification } = notification_viewmodel()

  const on_exit_press = () => navigate('/dm')

  if (!map_id) {
    return <div style={{ padding: 24 }}>No map selected.</div>
  }

  return (
    <div className="map-builder">
      <NotificationCenter notifications={notifications} on_dismiss={remove_notification} />
      <TopBar
        className="map-builder__top-bar"
        title={selected_campaign ? `${selected_campaign.name} — Map Builder` : 'Map Builder'}
        left={
          <Button variant="ghost" size="small" onClick={on_exit_press}>
            Exit Map Builder
          </Button>
        }
      />
      <MapScene mode="build" map_id={map_id} />
      {selected_campaign && <AssetCatalogPanel campaign_id={selected_campaign.id} />}
    </div>
  )
}
