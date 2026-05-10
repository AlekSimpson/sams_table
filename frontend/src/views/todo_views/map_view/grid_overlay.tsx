// VIEW layer — R3F grid plane rendered at y=0
import { Grid } from '@react-three/drei'

export default function GridOverlay() {
  return (
    <Grid
      args={[30, 30]}
      cellSize={1}
      cellThickness={0.5}
      cellColor="#4a4a6a"
      sectionSize={5}
      sectionThickness={1}
      sectionColor="#6a6aaa"
      fadeDistance={50}
      fadeStrength={1}
      followCamera={false}
      infiniteGrid={false}
    />
  )
}
