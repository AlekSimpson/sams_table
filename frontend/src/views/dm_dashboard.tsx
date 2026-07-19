// VIEW layer — DM dashboard shell (pre-session sidebar nav vs. in-session map + control sidebar)
import { dm_dashboard_viewmodel } from '../viewmodels/dm_dashboard_viewmodel'
import { Button, Card, Panel, Sidebar, TopBar } from './components'
import '../../styles/dm_dashboard.css'

export default function DMDashboard() {
  const { session, selected_campaign, dm_dashboard_shell_model } = dm_dashboard_viewmodel()
  const model = dm_dashboard_shell_model()
  const is_in_session = session !== null

  return (
    <div className="dm-dashboard">
      <TopBar title={selected_campaign?.name ?? 'DM Dashboard'} />

      {is_in_session ? (
        <div className="dm-dashboard__session-body">
          <main className="dm-dashboard__map-region">
            <div className="scaffold-placeholder dm-dashboard__map-placeholder">
              3D map view — coming soon
            </div>
          </main>

          <Sidebar side="right" collapsible>
            <div className="dm-dashboard__control-sections">
              <Panel>
                <span className="section-label">Initiative</span>
                <div className="scaffold-placeholder">Initiative — coming soon</div>
              </Panel>
              <Panel>
                <span className="section-label">Combat Controls</span>
                <div className="scaffold-placeholder">Combat controls — coming soon</div>
              </Panel>
              <Panel>
                <span className="section-label">Permissions</span>
                <div className="scaffold-placeholder">Permissions — coming soon</div>
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
              {model.current_tab === 'campaigns' && (
                <div className="scaffold-placeholder">Campaign list — coming soon</div>
              )}
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
