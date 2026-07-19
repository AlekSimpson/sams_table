// VIEW layer — campaign detail shown when a campaign is selected (Characters/Maps tabs + Start Session)
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { dm_dashboard_viewmodel } from '../viewmodels/dm_dashboard_viewmodel'
import { DNDCampaign } from '../types/dnd_types'
import { Button, Card, Input, Panel } from './components'
import '../../styles/campaign_detail_panel.css'

interface CampaignDetailPanelProps {
  campaign: DNDCampaign
}

export default function CampaignDetailPanel({ campaign }: CampaignDetailPanelProps) {
  const { start_session, campaign_detail_panel_model } = dm_dashboard_viewmodel()
  const model = campaign_detail_panel_model(campaign.id)

  useEffect(() => {
    model.load_characters()
    model.load_maps()
  }, [campaign.id])

  return (
    <div className="campaign-detail-panel">
      <div className="campaign-detail-panel__header">
        <span className="section-label">{campaign.name}</span>
        <Button variant="primary" size="small" onClick={start_session}>
          Start Session
        </Button>
      </div>

      <nav className="campaign-detail-panel__tabs">
        <Button
          variant={model.current_tab === 'characters' ? 'secondary' : 'ghost'}
          size="small"
          onClick={model.on_characters_tab_press}
        >
          Characters
        </Button>
        <Button
          variant={model.current_tab === 'maps' ? 'secondary' : 'ghost'}
          size="small"
          onClick={model.on_maps_tab_press}
        >
          Maps
        </Button>
      </nav>

      {model.current_tab === 'characters' && (
        <div className="campaign-detail-panel__list">
          {model.characters.length === 0 ? (
            <div className="campaign-detail-panel__empty">No characters in this campaign yet.</div>
          ) : (
            model.characters.map((character) => (
              <Card key={character.id} className="campaign-detail-panel__character-row">
                <span className="campaign-detail-panel__character-name">{character.name}</span>
                <span className="campaign-detail-panel__character-meta">
                  Level {character.level} {character.race} {character.class}
                </span>
              </Card>
            ))
          )}
        </div>
      )}

      {model.current_tab === 'maps' && (
        <div className="campaign-detail-panel__list">
          <Panel className="campaign-detail-panel__map-form">
            <span className="section-label">New Map</span>

            <Input
              id="new-map-name-input"
              label="Name"
              type="text"
              value={model.new_map_name}
              onChange={model.on_new_map_name_change}
              placeholder="Map name"
            />

            <div className="campaign-detail-panel__map-form-grid-fields">
              <Input
                id="new-map-grid-width-input"
                label="Grid Width"
                type="number"
                min={1}
                step={1}
                value={model.new_map_grid_width_draft}
                onChange={model.on_new_map_grid_width_change}
              />
              <Input
                id="new-map-grid-height-input"
                label="Grid Height"
                type="number"
                min={1}
                step={1}
                value={model.new_map_grid_height_draft}
                onChange={model.on_new_map_grid_height_change}
              />
            </div>

            {model.new_map_validation_error && (
              <span className="campaign-detail-panel__map-form-error" role="alert">
                {model.new_map_validation_error}
              </span>
            )}

            <Button
              variant="primary"
              size="small"
              onClick={model.on_create_map_press}
              disabled={!model.new_map_name.trim() || model.is_creating_map}
            >
              {model.is_creating_map ? 'Creating…' : 'Create Map'}
            </Button>
          </Panel>

          {model.maps.length === 0 ? (
            <div className="campaign-detail-panel__empty">No maps in this campaign yet.</div>
          ) : (
            model.maps.map((map) => (
              <Card key={map.id} className="campaign-detail-panel__map-row">
                <div className="campaign-detail-panel__map-info">
                  <span className="campaign-detail-panel__map-name">{map.name}</span>
                  <span className="campaign-detail-panel__map-meta">
                    {map.grid_width} × {map.grid_height}
                  </span>
                </div>
                <Link
                  to={`/dm/map-builder/${map.id}`}
                  className="button button--ghost button--small"
                >
                  Go to Map Builder
                </Link>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
