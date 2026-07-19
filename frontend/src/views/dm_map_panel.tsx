// VIEW layer — DM in-session map region: campaign map dropdown, hide-from-players
// toggle, and the 3D map canvas itself (mode="build" enables tile placement).
import { useEffect, useState } from 'react'
import { dm_dashboard_viewmodel } from '../viewmodels/dm_dashboard_viewmodel'
import { map_viewmodel } from '../viewmodels/map_viewmodel'
import MapScene from './todo_views/map_view/map_view'
import AssetCatalogPanel from './todo_views/map_view/asset_catalogue_panel'
import { Button, Panel } from './components'
import '../../styles/dm_map_panel.css'

interface DmMapPanelProps {
  campaign_id: string
}

export default function DmMapPanel({ campaign_id }: DmMapPanelProps) {
  const { active_map_id, set_active_map, map_selector_model } = dm_dashboard_viewmodel()
  const { maps, load_maps } = map_selector_model(campaign_id)
  const { activate_map } = map_viewmodel()
  const [is_hidden_from_players, set_is_hidden_from_players] = useState(false)

  useEffect(() => {
    load_maps()
  }, [campaign_id, load_maps])

  const on_map_select = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected_map_id = event.target.value
    if (!selected_map_id) return
    set_active_map(selected_map_id)
    activate_map(is_hidden_from_players ? null : selected_map_id)
  }

  const on_hide_toggle_press = () => {
    const next_is_hidden_from_players = !is_hidden_from_players
    set_is_hidden_from_players(next_is_hidden_from_players)
    if (active_map_id) activate_map(next_is_hidden_from_players ? null : active_map_id)
  }

  return (
    <div className="dm-map-panel">
      <Panel className="dm-map-panel__controls">
        <select
          className="input dm-map-panel__map-select"
          aria-label="Active map"
          value={active_map_id ?? ''}
          onChange={on_map_select}
        >
          <option value="" disabled>Select a map…</option>
          {maps.map((map) => (
            <option key={map.id} value={map.id}>{map.name}</option>
          ))}
        </select>
        <Button
          variant={is_hidden_from_players ? 'secondary' : 'ghost'}
          size="small"
          disabled={!active_map_id}
          onClick={on_hide_toggle_press}
        >
          {is_hidden_from_players ? 'Map hidden from players' : 'Hide map from players'}
        </Button>
      </Panel>

      <div className="dm-map-panel__canvas">
        {active_map_id ? (
          <>
            <MapScene mode="build" map_id={active_map_id} />
            <AssetCatalogPanel campaign_id={campaign_id} />
          </>
        ) : (
          <div className="scaffold-placeholder">Select a map to begin</div>
        )}
      </div>
    </div>
  )
}
