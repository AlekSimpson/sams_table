// VIEW layer — DM dashboard shell (pre-session sidebar nav vs. in-session map + control sidebar)
import { useEffect, useState } from 'react'
import { dm_dashboard_viewmodel } from '../viewmodels/dm_dashboard_viewmodel'
import { notification_viewmodel } from '../viewmodels/notification_viewmodel'
import { DNDCampaign } from '../types/dnd_types'
import { Badge, Button, Card, Input, Modal, NotificationCenter, Panel, SessionStatusBar, Sidebar, SIDEBAR_COLLAPSED_STORAGE_KEY, TopBar } from './components'
import CampaignDetailPanel from './campaign_detail_panel'
import DmCombatControlsPanel from './dm_combat_controls_panel'
import DmMapPanel from './dm_map_panel'
import DmPermissionPanel from './dm_permission_panel'
import '../../styles/dm_dashboard.css'

interface CampaignSidebarItemProps {
  campaign: DNDCampaign
  is_selected: boolean
  on_select: () => void
}

function CampaignSidebarItem({ campaign, is_selected, on_select }: CampaignSidebarItemProps) {
  return (
    <div
      className={`campaign-sidebar-item${is_selected ? ' campaign-sidebar-item--active' : ''}`}
      onClick={on_select}
      role="button"
      tabIndex={0}
    >
      <span className="campaign-sidebar-item__icon" aria-hidden="true">📁</span>
      <div className="campaign-sidebar-item__info">
        <div className="campaign-sidebar-item__name">{campaign.name}</div>
        <div className="campaign-sidebar-item__description">
          {campaign.description || 'No description set'}
        </div>
      </div>
    </div>
  )
}

export default function DMDashboard() {
  const {
    session,
    selected_campaign,
    joined_players,
    campaigns,
    dashboard_error,
    load_campaigns,
    select_campaign,
    end_session,
    campaign_sidebar_model,
    session_controls_model,
  } = dm_dashboard_viewmodel()
  const { notifications, remove_notification } = notification_viewmodel()
  const session_controls = session_controls_model(session?.join_code ?? '')
  const new_campaign_form = campaign_sidebar_model()
  const [is_new_campaign_modal_open, set_is_new_campaign_modal_open] = useState(false)
  const is_in_session = session !== null

  // Focus mode merges the sidebar-collapse and pane-maximize toggles into one boolean,
  // driving both the Sidebar and Card's controlled state at once (pre-session shell only).
  // Persisted under the same key the sidebar previously used standalone, since it's the
  // same underlying preference.
  const [is_focus_mode, set_is_focus_mode] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true'
  )
  const on_focus_mode_toggle_press = () => {
    const next_is_focus_mode = !is_focus_mode
    set_is_focus_mode(next_is_focus_mode)
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next_is_focus_mode))
  }

  useEffect(() => {
    load_campaigns()
  }, [])

  const on_create_campaign_press = () => {
    new_campaign_form.on_create_press()
    set_is_new_campaign_modal_open(false)
  }

  return (
    <div className="dm-dashboard">
      <NotificationCenter notifications={notifications} on_dismiss={remove_notification} />
      <TopBar
        title={selected_campaign?.name ?? 'DM Dashboard'}
        right={
          <SessionStatusBar
            role="dm"
            is_in_session={is_in_session}
            dm_props={{
              join_code: session?.join_code ?? '',
              copied: session_controls.copied,
              on_copy_press: session_controls.on_copy_press,
              on_end_session_press: end_session,
            }}
          />
        }
      />

      {dashboard_error && (
        <div className="dm-dashboard__error" role="alert">{dashboard_error}</div>
      )}

      {is_in_session ? (
        <div className="dm-dashboard__session-body">
          <main className="dm-dashboard__map-region">
            {selected_campaign ? (
              <DmMapPanel campaign_id={selected_campaign.id} />
            ) : (
              <div className="scaffold-placeholder dm-dashboard__map-placeholder">
                No campaign selected
              </div>
            )}
          </main>

          <Sidebar side="right" collapsible className="dm-dashboard__control-sidebar">
            <div className="dm-dashboard__control-sections">
              <Panel>
                <span className="section-label">Players</span>
                <div className="dm-dashboard__players-list">
                  {joined_players.length === 0 ? (
                    <Badge variant="neutral">No players joined yet</Badge>
                  ) : (
                    joined_players.map((player) => (
                      <Badge key={player.user_id} variant="success">
                        {player.character_name}
                      </Badge>
                    ))
                  )}
                </div>
              </Panel>
              <Panel>
                <span className="section-label">Combat Controls</span>
                {selected_campaign ? (
                  <DmCombatControlsPanel campaign_id={selected_campaign.id} />
                ) : (
                  <div className="scaffold-placeholder">Combat controls — coming soon</div>
                )}
              </Panel>
              <Panel>
                <span className="section-label">Permissions</span>
                {selected_campaign ? (
                  <DmPermissionPanel campaign_id={selected_campaign.id} />
                ) : (
                  <div className="scaffold-placeholder">Permissions — coming soon</div>
                )}
              </Panel>
            </div>
          </Sidebar>
        </div>
      ) : (
        <div className="dm-dashboard__body">
          <Sidebar collapsed={is_focus_mode}>
            <div className="dm-dashboard__sidebar-header">
              <span className="section-label">Campaigns</span>
              <Button
                variant="ghost"
                size="small"
                onClick={() => set_is_new_campaign_modal_open(true)}
                aria-label="New Campaign"
              >
                +
              </Button>
            </div>
            <nav className="dm-dashboard__campaign-list">
              {campaigns.length === 0 ? (
                <div className="dm-dashboard__campaign-list-empty">
                  No campaigns yet — create one to get started.
                </div>
              ) : (
                campaigns.map((campaign) => (
                  <CampaignSidebarItem
                    key={campaign.id}
                    campaign={campaign}
                    is_selected={campaign.id === selected_campaign?.id}
                    on_select={() => select_campaign(campaign.id)}
                  />
                ))
              )}
            </nav>
          </Sidebar>

          <Card
            maximizable
            is_maximized={is_focus_mode}
            className="dm-dashboard__panel"
          >
            <div className="pane-toolbar">
              <button
                type="button"
                className="pane-focus-toggle"
                onClick={on_focus_mode_toggle_press}
                aria-label={is_focus_mode ? 'Exit focus mode' : 'Enter focus mode'}
              >
                {is_focus_mode ? '⤡' : '⤢'}
              </button>
            </div>
            <main className="dm-dashboard__content">
              {selected_campaign ? (
                <CampaignDetailPanel campaign={selected_campaign} />
              ) : (
                <div className="scaffold-placeholder">
                  Select a campaign from the sidebar, or create one to get started.
                </div>
              )}
            </main>
          </Card>
        </div>
      )}

      <Modal
        is_open={is_new_campaign_modal_open}
        onClose={() => set_is_new_campaign_modal_open(false)}
        title="New Campaign"
      >
        <div className="dm-dashboard__new-campaign-form">
          <Input
            id="new-campaign-name-input"
            label="Name"
            type="text"
            value={new_campaign_form.name}
            onChange={new_campaign_form.on_name_change}
            placeholder="Campaign name"
          />

          <label className="input-field" htmlFor="new-campaign-description-input">
            <span className="input-field__label">Description</span>
            <textarea
              id="new-campaign-description-input"
              className="input dm-dashboard__description-input"
              value={new_campaign_form.description}
              onChange={new_campaign_form.on_description_change}
              placeholder="What's this campaign about?"
              rows={3}
            />
          </label>

          <Button
            variant="primary"
            size="small"
            onClick={on_create_campaign_press}
            disabled={!new_campaign_form.name.trim()}
          >
            Create Campaign
          </Button>
        </div>
      </Modal>
    </div>
  )
}
