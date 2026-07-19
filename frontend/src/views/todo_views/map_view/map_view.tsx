// VIEW layer — shared R3F scene (builder + viewer modes)
import { useEffect, useState } from 'react'
import { Canvas, ThreeEvent } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import GridOverlay from './grid_overlay'
import TileRenderer from './tile_renderer'
import TokenLayer from './token_layer'
import { map_viewmodel } from '../../../viewmodels/map_viewmodel'

interface MapSceneProps {
  /** 'build' enables placement interactions (DM only); 'view' is read-only. */
  mode: 'view' | 'build'
  map_id: string
}

export default function MapScene({ mode, map_id }: MapSceneProps) {
  const { tiles_loading, tiles_error, selected_asset, load_map, place_map_tile } = map_viewmodel()
  const [is_dragging_token, set_is_dragging_token] = useState(false)

  useEffect(() => {
    load_map(map_id)
  }, [map_id, load_map])

  // Builder click-to-place: the invisible ground plane's intersection point maps to grid
  // coordinates as [grid_x, grid_z] (ground plane), placing at elevation grid_y = 0.
  const handle_grid_click = async (event: ThreeEvent<MouseEvent>) => {
    if (mode !== 'build' || !selected_asset) return
    event.stopPropagation()
    await place_map_tile(map_id, {
      asset_id: selected_asset.id,
      asset_source: selected_asset.source,
      grid_x: Math.round(event.point.x),
      grid_y: 0,
      grid_z: Math.round(event.point.z),
      rotation_y: 0,
    })
  }

  if (tiles_loading) {
    return <div style={{ padding: 24, color: 'var(--color-text-secondary)' }}>Loading map…</div>
  }

  if (tiles_error) {
    return <div style={{ padding: 24, color: 'var(--color-danger)' }}>Failed to load map: {tiles_error}</div>
  }

  return (
    <Canvas camera={{ position: [10, 10, 10], fov: 60 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <GridOverlay />
      <TileRenderer map_id={map_id} mode={mode} />
      <TokenLayer on_drag_state_change={set_is_dragging_token} />
      {mode === 'build' && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={handle_grid_click}>
          <planeGeometry args={[30, 30]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      )}
      <OrbitControls makeDefault enabled={!is_dragging_token} />
    </Canvas>
  )
}
