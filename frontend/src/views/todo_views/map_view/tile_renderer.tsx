// VIEW layer — renders map tiles from the map store as Three.js meshes
import { ThreeEvent } from '@react-three/fiber'
import { map_viewmodel } from '../../../viewmodels/map_viewmodel'

interface TileRendererProps {
  map_id: string
  mode: 'view' | 'build'
}

export default function TileRenderer({ map_id, mode }: TileRendererProps) {
  const { tiles, remove_map_tile } = map_viewmodel()
  // TODO: render distinct geometry per asset_id (currently a uniform placeholder box)
  // TODO: for uploaded tiles, use STLLoader via useSTLGeometry hook
  return (
    <>
      {tiles.map((tile) => {
        const handle_click = (event: ThreeEvent<MouseEvent>) => {
          if (mode !== 'build') return
          event.stopPropagation()
          remove_map_tile(map_id, tile.id)
        }
        return (
          <mesh
            key={tile.id}
            position={[tile.grid_x, tile.grid_y, tile.grid_z]}
            rotation={[0, tile.rotation_y, 0]}
            onClick={handle_click}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={tile.asset_source === 'uploaded' ? '#aa6a4a' : '#6a8aaa'} />
          </mesh>
        )
      })}
    </>
  )
}
