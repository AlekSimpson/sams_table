// VIEW layer — DM's compact sidebar panel for controlling what each player can do on
// the map (move tokens / place tiles). Loads existing permissions on mount and persists
// each toggle immediately, mirroring dm_combat_controls_panel's "toggle button, immediate
// persist" pattern.
import { useEffect } from 'react'
import { dm_dashboard_viewmodel } from '../viewmodels/dm_dashboard_viewmodel'
import { Badge, Button } from './components'
import '../../styles/dm_permission_panel.css'

interface DmPermissionPanelProps {
  campaign_id: string
}

export default function DmPermissionPanel({ campaign_id }: DmPermissionPanelProps) {
  const { joined_players, permission_panel_model } = dm_dashboard_viewmodel()
  const { get_player_permissions, load_permissions, toggle_permission } = permission_panel_model(campaign_id)

  useEffect(() => {
    load_permissions()
  }, [campaign_id, load_permissions])

  if (joined_players.length === 0) {
    return <Badge variant="neutral">No players joined yet</Badge>
  }

  return (
    <div className="dm-permission-panel">
      {joined_players.map((player) => {
        const player_permissions = get_player_permissions(player.user_id)
        return (
          <div key={player.user_id} className="dm-permission-panel__row">
            <span className="dm-permission-panel__player-name">{player.character_name}</span>
            <div className="dm-permission-panel__toggles">
              <Button
                variant={player_permissions.can_move_tokens ? 'secondary' : 'ghost'}
                size="small"
                onClick={() => toggle_permission(player.user_id, 'can_move_tokens')}
              >
                Can move tokens
              </Button>
              <Button
                variant={player_permissions.can_place_tiles ? 'secondary' : 'ghost'}
                size="small"
                onClick={() => toggle_permission(player.user_id, 'can_place_tiles')}
              >
                Can place tiles
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
