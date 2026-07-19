// VIEW layer — shared "view and build tools for THIS map" piece: the 3D canvas plus
// asset catalogue panel, keyed by a specific map_id. Deliberately has NO session/
// broadcast/hide-toggle logic — that chrome is session-specific and lives in whichever
// caller needs it (see dm_map_panel.tsx for the in-session wrapper, and
// campaign_detail_panel.tsx for the pre-session Maps tab wrapper).
import MapScene from './todo_views/map_view/map_view'
import AssetCatalogPanel from './todo_views/map_view/asset_catalogue_panel'

interface DmMapEditorProps {
  map_id: string
  campaign_id: string
}

export default function DmMapEditor({ map_id, campaign_id }: DmMapEditorProps) {
  return (
    <>
      <MapScene mode="build" map_id={map_id} />
      <AssetCatalogPanel campaign_id={campaign_id} />
    </>
  )
}
