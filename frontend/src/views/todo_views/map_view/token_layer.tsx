// VIEW layer — renders character tokens as meshes with HP/name overlays; drag-to-move with grid snapping
import { useEffect, useState } from 'react'
import { Html } from '@react-three/drei'
import { ThreeEvent } from '@react-three/fiber'
import { character_viewmodel } from '../../../viewmodels/character_viewmodel'
import { map_viewmodel } from '../../../viewmodels/map_viewmodel'
import { session_viewmodel } from '../../../viewmodels/session_viewmodel'
import { DNDCharacter } from '../../../types/dnd_types'
import { Token } from '../../../types/game_types'

interface TokenLayerProps {
  /** Lets the parent scene disable OrbitControls while a token is being dragged. */
  on_drag_state_change?: (is_dragging: boolean) => void
}

export default function TokenLayer({ on_drag_state_change }: TokenLayerProps) {
  const { characters, load_campaign_characters } = character_viewmodel()
  const { tokens, permissions, load_permissions, move_token } = map_viewmodel()
  const { user, role, campaign_id } = session_viewmodel()

  const [dragging_token_id, set_dragging_token_id] = useState<string | null>(null)
  const [drag_preview_position, set_drag_preview_position] = useState<{ grid_x: number; grid_y: number } | null>(null)

  useEffect(() => {
    if (!campaign_id) return
    load_campaign_characters(campaign_id)
    load_permissions(campaign_id)
  }, [campaign_id, load_campaign_characters, load_permissions])

  // Fallback in case the pointer is released outside the drag plane (e.g. off-canvas).
  useEffect(() => {
    if (!dragging_token_id) return
    const handle_window_pointer_up = () => {
      set_dragging_token_id(null)
      set_drag_preview_position(null)
      on_drag_state_change?.(false)
    }
    window.addEventListener('pointerup', handle_window_pointer_up)
    return () => window.removeEventListener('pointerup', handle_window_pointer_up)
  }, [dragging_token_id, on_drag_state_change])

  // DM can move any token; a player can only move their own character's token, and
  // only if the campaign's permissions grant them can_move_tokens.
  const can_move_token = (character: DNDCharacter | undefined): boolean => {
    if (!character) return false
    if (role === 'dm') return true
    if (role !== 'player' || !user) return false
    const owns_character = character.player_id === user.id
    const permission_entry = permissions.find((entry) => entry.user_id === user.id)
    return owns_character && (permission_entry?.can_move_tokens ?? false)
  }

  const handle_token_pointer_down = (event: ThreeEvent<PointerEvent>, token: Token, character: DNDCharacter | undefined) => {
    if (!can_move_token(character)) return
    event.stopPropagation()
    set_dragging_token_id(token.id)
    set_drag_preview_position({ grid_x: token.grid_x, grid_y: token.grid_y })
    on_drag_state_change?.(true)
  }

  // Ground-plane intersection maps to grid coordinates the same way tile placement
  // does in map_view.tsx: [event.point.x, event.point.z] rounded to integers.
  const handle_drag_plane_pointer_move = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging_token_id) return
    event.stopPropagation()
    set_drag_preview_position({ grid_x: Math.round(event.point.x), grid_y: Math.round(event.point.z) })
  }

  const handle_drag_plane_pointer_up = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging_token_id) return
    event.stopPropagation()
    const dragged_token = tokens.find((token) => token.id === dragging_token_id)
    const target_grid_x = drag_preview_position?.grid_x ?? dragged_token?.grid_x ?? 0
    const target_grid_y = drag_preview_position?.grid_y ?? dragged_token?.grid_y ?? 0
    const target_cell_occupied = tokens.some(
      (token) => token.id !== dragging_token_id && token.grid_x === target_grid_x && token.grid_y === target_grid_y
    )
    if (dragged_token && !target_cell_occupied) {
      move_token(dragged_token.id, dragged_token.character_id, target_grid_x, target_grid_y)
    }
    set_dragging_token_id(null)
    set_drag_preview_position(null)
    on_drag_state_change?.(false)
  }

  return (
    <>
      {tokens.map((token) => {
        const character = characters[token.character_id]
        const is_dragging = dragging_token_id === token.id
        const grid_x = is_dragging && drag_preview_position ? drag_preview_position.grid_x : token.grid_x
        const grid_y = is_dragging && drag_preview_position ? drag_preview_position.grid_y : token.grid_y
        const draggable = can_move_token(character)

        return (
          <group key={token.id} position={[grid_x, 0, grid_y]}>
            <mesh position={[0, 0.5, 0]} onPointerDown={(event) => handle_token_pointer_down(event, token, character)}>
              <cylinderGeometry args={[0.35, 0.35, 0.5, 16]} />
              <meshStandardMaterial color={draggable ? '#5ac86a' : '#8a5ac8'} />
            </mesh>
            <Html position={[0, 1.1, 0]} center distanceFactor={10}>
              <div style={{ color: '#fff', fontSize: 12, whiteSpace: 'nowrap', textShadow: '0 0 3px #000' }}>
                {character ? `${character.name} (${character.current_hp}/${character.max_hp})` : token.character_id}
              </div>
            </Html>
          </group>
        )
      })}
      {/* Invisible plane dedicated to token-drag raycasting. Kept just above y=0 so it
          takes raycast priority over map_view.tsx's tile-placement plane in build mode. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.001, 0]}
        onPointerMove={handle_drag_plane_pointer_move}
        onPointerUp={handle_drag_plane_pointer_up}
      >
        <planeGeometry args={[30, 30]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </>
  )
}
