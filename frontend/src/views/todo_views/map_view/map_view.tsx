// VIEW layer — shared R3F scene (builder + viewer modes)
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import GridOverlay from './grid_overlay'
import TileRenderer from './tile_renderer'
import TokenLayer from './token_layer'

interface MapSceneProps {
  /** 'build' enables placement interactions (DM only); 'view' is read-only. */
  mode: 'view' | 'build'
}

export default function MapScene({ mode }: MapSceneProps) {
  void mode // TODO: conditionally mount <BuilderInteractionLayer /> when mode === 'build'
  return (
    <Canvas camera={{ position: [10, 10, 10], fov: 60 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <GridOverlay />
      <TileRenderer />
      <TokenLayer />
      <OrbitControls makeDefault />
    </Canvas>
  )
}
