// VIEW layer — renders character tokens as meshes with HP overlays
import { character_viewmodel } from '../../../viewmodels/character_viewmodel'

export default function TokenLayer() {
  const { characters } = character_viewmodel()
  void characters
  // TODO: for each character with a token position, render a cylinder mesh
  // TODO: use <Html> from drei for HP/name overlay above each token
  return null
}
