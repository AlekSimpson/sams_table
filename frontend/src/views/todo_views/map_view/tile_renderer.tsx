// VIEW layer — renders map tiles from the map store as Three.js meshes
import { map_viewmodel } from '../../../viewmodels/map_viewmodel'

export default function TileRenderer() {
  const { tiles } = map_viewmodel()
  void tiles
  // TODO: iterate tiles, render BoxGeometry/CylinderGeometry based on asset_id
  // TODO: for uploaded tiles, use STLLoader via useSTLGeometry hook
  // TODO: dispose geometries on unmount
  return null
}
