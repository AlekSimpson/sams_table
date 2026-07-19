// VIEW layer — campaign detail shown when a campaign is selected (Characters/Maps tabs + Start Session)
import { useEffect } from 'react'
import { dm_dashboard_viewmodel } from '../viewmodels/dm_dashboard_viewmodel'
import { DNDCampaign } from '../types/dnd_types'
import { Button, Card, Input, Panel } from './components'
import CharacterSheet from './character_sheet'
import DmMapEditor from './dm_map_editor'
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
        model.selected_character_id ? (
          <div className="campaign-detail-panel__character-sheet-frame">
            <Button
              variant="ghost"
              size="small"
              onClick={model.on_back_to_characters_press}
              className="campaign-detail-panel__back-button"
            >
              ← Back to characters
            </Button>
            <div className="campaign-detail-panel__character-sheet-body">
              <CharacterSheet character_id={model.selected_character_id} />
            </div>
          </div>
        ) : (
          <div className="campaign-detail-panel__list">
            {model.characters.length === 0 ? (
              <div className="campaign-detail-panel__empty">No characters in this campaign yet.</div>
            ) : (
              model.characters.map((character) => (
                <Card
                  key={character.id}
                  className="campaign-detail-panel__character-row campaign-detail-panel__character-row--clickable"
                  onClick={() => model.on_character_select(character.id)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="campaign-detail-panel__character-name">{character.name}</span>
                  <span className="campaign-detail-panel__character-meta">
                    Level {character.level} {character.race} {character.class}
                  </span>
                </Card>
              ))
            )}
          </div>
        )
      )}

      {model.current_tab === 'maps' && (
        model.selected_map_id ? (
          <div className="campaign-detail-panel__map-editor-frame">
            <Button
              variant="ghost"
              size="small"
              onClick={model.on_back_to_maps_press}
              className="campaign-detail-panel__back-button"
            >
              ← Back to maps
            </Button>
            <div className="campaign-detail-panel__map-editor-body">
              <DmMapEditor map_id={model.selected_map_id} campaign_id={campaign.id} />
            </div>
          </div>
        ) : (
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
                <Card
                  key={map.id}
                  className="campaign-detail-panel__map-row campaign-detail-panel__map-row--clickable"
                  onClick={() => model.on_map_select(map.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="campaign-detail-panel__map-info">
                    <span className="campaign-detail-panel__map-name">{map.name}</span>
                    <span className="campaign-detail-panel__map-meta">
                      {map.grid_width} × {map.grid_height}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        )
      )}
    </div>
  )
}
