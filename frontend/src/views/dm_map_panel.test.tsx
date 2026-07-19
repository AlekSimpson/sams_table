import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// MapScene wraps a react-three-fiber <Canvas>, which needs a WebGL context jsdom
// doesn't provide - so it's mocked here with a stand-in that exposes its
// `on_tile_placed` prop via a button, letting the test simulate "placement actually
// succeeded" the same way the real MapScene does (only calling it after a real,
// resolved success - see map_view.tsx's handle_grid_click).
vi.mock('./todo_views/map_view/map_view', () => ({
  default: ({ on_tile_placed }: { on_tile_placed?: () => void }) => (
    <button onClick={on_tile_placed}>simulate successful tile placement</button>
  ),
}))

vi.mock('./todo_views/map_view/asset_catalogue_panel', () => ({
  default: () => <div>asset catalogue</div>,
}))

const { mock_dm_dashboard_viewmodel, mock_map_viewmodel } = vi.hoisted(() => ({
  mock_dm_dashboard_viewmodel: vi.fn(),
  mock_map_viewmodel: vi.fn(),
}))

vi.mock('../viewmodels/dm_dashboard_viewmodel', () => ({
  dm_dashboard_viewmodel: mock_dm_dashboard_viewmodel,
}))

vi.mock('../viewmodels/map_viewmodel', () => ({
  map_viewmodel: mock_map_viewmodel,
}))

import DmMapPanel from './dm_map_panel'

beforeEach(() => {
  vi.resetAllMocks()
  mock_dm_dashboard_viewmodel.mockReturnValue({
    active_map_id: 'map-1',
    set_active_map: vi.fn(),
    map_selector_model: () => ({ maps: [], load_maps: vi.fn() }),
  })
  mock_map_viewmodel.mockReturnValue({ activate_map: vi.fn() })
})

describe('DmMapPanel', () => {
  it('does not show a placement confirmation before any tile has been placed', () => {
    render(<DmMapPanel campaign_id="campaign-1" />)

    expect(screen.queryByText('Tile placed')).not.toBeInTheDocument()
  })

  it('shows a placement confirmation once a tile placement actually succeeds', () => {
    render(<DmMapPanel campaign_id="campaign-1" />)

    fireEvent.click(screen.getByText('simulate successful tile placement'))

    expect(screen.getByText('Tile placed')).toBeInTheDocument()
  })

  it('does not show a placement confirmation while no map is selected', () => {
    mock_dm_dashboard_viewmodel.mockReturnValue({
      active_map_id: null,
      set_active_map: vi.fn(),
      map_selector_model: () => ({ maps: [], load_maps: vi.fn() }),
    })

    render(<DmMapPanel campaign_id="campaign-1" />)

    expect(screen.queryByText('Tile placed')).not.toBeInTheDocument()
    expect(screen.queryByText('simulate successful tile placement')).not.toBeInTheDocument()
  })
})
