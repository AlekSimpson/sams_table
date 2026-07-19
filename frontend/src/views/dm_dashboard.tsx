// VIEW layer — DM dashboard shell (pre-session sidebar nav vs. in-session map + control sidebar)
import { dm_dashboard_viewmodel } from '../viewmodels/dm_dashboard_viewmodel'
import { notification_viewmodel } from '../viewmodels/notification_viewmodel'
import { Badge, Button, Card, NotificationCenter, Panel, SessionStatusBar, Sidebar, TopBar } from './components'
import CampaignListPanel from './campaign_list_panel'
import DmCombatControlsPanel from './dm_combat_controls_panel'
import DmMapPanel from './dm_map_panel'
import DmPermissionPanel from './dm_permission_panel'
import '../../styles/dm_dashboard.css'

export default function DMDashboard() {
  const { session, selected_campaign, joined_players, end_session, dm_dashboard_shell_model, session_controls_model } =
    dm_dashboard_viewmodel()
  const { notifications, remove_notification } = notification_viewmodel()
  const model = dm_dashboard_shell_model()
  const session_controls = session_controls_model(session?.join_code ?? '')
  const is_in_session = session !== null

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

          <Sidebar side="right" collapsible>
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
          <Sidebar collapsible>
            <nav className="dm-dashboard__nav">
              <Button
                variant={model.current_tab === 'campaigns' ? 'secondary' : 'ghost'}
                size="small"
                full_width
                onClick={model.on_campaigns_tab_press}
              >
                Campaigns
              </Button>
              <Button
                variant={model.current_tab === 'maps' ? 'secondary' : 'ghost'}
                size="small"
                full_width
                onClick={model.on_maps_tab_press}
              >
                Maps
              </Button>
              <Button
                variant={model.current_tab === 'characters' ? 'secondary' : 'ghost'}
                size="small"
                full_width
                onClick={model.on_characters_tab_press}
              >
                Characters
              </Button>
            </nav>
          </Sidebar>

          <Card className="dm-dashboard__panel">
            <main className="dm-dashboard__content">
              {model.current_tab === 'campaigns' && <CampaignListPanel />}
              {model.current_tab === 'maps' && (
                <div className="scaffold-placeholder">Maps — coming soon</div>
              )}
              {model.current_tab === 'characters' && (
                <div className="scaffold-placeholder">Characters — coming soon</div>
              )}
            </main>
          </Card>
        </div>
      )}
    </div>
  )
}
