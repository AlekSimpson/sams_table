// VIEW layer — DM's campaign list + inline "New Campaign" form (Campaigns tab of the DM dashboard)
import { useEffect } from 'react'
import { dm_dashboard_viewmodel } from '../viewmodels/dm_dashboard_viewmodel'
import { DNDCampaign } from '../types/dnd_types'
import { Button, Card, Input, Panel } from './components'
import CampaignDetailPanel from './campaign_detail_panel'
import '../../styles/campaign_list_panel.css'

interface CampaignCardProps {
  campaign: DNDCampaign
}

function CampaignCard({ campaign }: CampaignCardProps) {
  const { campaign_card_model } = dm_dashboard_viewmodel()
  const model = campaign_card_model(campaign)

  return (
    <Card className="campaign-card" onClick={model.on_card_click}>
      <div className="campaign-card__name">{campaign.name}</div>
      <div className="campaign-card__description">
        {campaign.description || 'No description set'}
      </div>
    </Card>
  )
}

export default function CampaignListPanel() {
  const { campaigns, selected_campaign, load_campaigns, campaign_list_panel_model } = dm_dashboard_viewmodel()
  const model = campaign_list_panel_model()

  useEffect(() => {
    load_campaigns()
  }, [])

  if (selected_campaign) {
    return (
      <div className="campaign-list-panel">
        <Button variant="ghost" size="small" onClick={model.on_back_press}>
          ← Back to campaigns
        </Button>
        <CampaignDetailPanel campaign={selected_campaign} />
      </div>
    )
  }

  return (
    <div className="campaign-list-panel">
      <Panel className="campaign-list-panel__form">
        <span className="section-label">New Campaign</span>

        <Input
          id="new-campaign-name-input"
          label="Name"
          type="text"
          value={model.name}
          onChange={model.on_name_change}
          placeholder="Campaign name"
        />

        <label className="input-field" htmlFor="new-campaign-description-input">
          <span className="input-field__label">Description</span>
          <textarea
            id="new-campaign-description-input"
            className="input campaign-list-panel__description-input"
            value={model.description}
            onChange={model.on_description_change}
            placeholder="What's this campaign about?"
            rows={3}
          />
        </label>

        <Button variant="primary" size="small" onClick={model.on_create_press} disabled={!model.name.trim()}>
          Create Campaign
        </Button>
      </Panel>

      <div className="campaign-list-panel__list-section">
        <span className="section-label">Your Campaigns</span>

        {campaigns.length === 0 ? (
          <div className="campaign-list-panel__empty">
            No campaigns yet — create one above to get started.
          </div>
        ) : (
          <div className="campaign-list-panel__grid">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
