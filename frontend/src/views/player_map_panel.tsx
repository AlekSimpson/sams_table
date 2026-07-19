// VIEW layer — player's in-session map region. Mirrors dm_map_panel.tsx's chrome (a
// Panel header above a canvas wrapper) but read-only: no map-select dropdown and no
// "hide from players" toggle, since players don't choose the active map — they only
// ever see whatever the DM has activated. Reuses dm_map_panel.css's shared classes
// rather than duplicating the same layout/styling under a second name.
import { useEffect } from 'react'
import { map_viewmodel } from '../viewmodels/map_viewmodel'
import MapScene from './todo_views/map_view/map_view'
import { Panel } from './components'
import '../../styles/dm_map_panel.css'

interface PlayerMapPanelProps {
  active_map_id: string | null
}

export default function PlayerMapPanel({ active_map_id }: PlayerMapPanelProps) {
  const { map_info_model } = map_viewmodel()
  const { map, load_map_info } = map_info_model(active_map_id)

  useEffect(() => {
    load_map_info()
  }, [active_map_id, load_map_info])

  return (
    <div className="dm-map-panel">
      {active_map_id && (
        <Panel className="dm-map-panel__controls">
          <span className="dm-map-panel__map-name">{map?.name ?? 'Live Map'}</span>
        </Panel>
      )}

      <div className="dm-map-panel__canvas">
        {active_map_id ? (
          // Player view is always view-only: build tooling (tile placement, the
          // asset catalogue) is DM-only and lives in dm_map_panel.tsx instead.
          <MapScene mode="view" map_id={active_map_id} />
        ) : (
          <div className="scaffold-placeholder" style={{ margin: '32px', padding: '60px 20px' }}>
            Not in a session — join with a code to view the live map
          </div>
        )}
      </div>
    </div>
  )
}
