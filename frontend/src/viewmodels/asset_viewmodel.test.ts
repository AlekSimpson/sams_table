import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UploadedAsset } from '../types/game_types'

// asset_api/campaign_api are mocked at the module level (rather than letting calls fall
// through to the mock backend) so every test controls success/failure directly, following
// the pattern in character_viewmodel.test.ts.
const { mock_asset_api, mock_campaign_api } = vi.hoisted(() => ({
  mock_asset_api: {
    upload: vi.fn<(form_data: FormData) => Promise<UploadedAsset>>(),
    getUrl: vi.fn<(asset_id: string) => string>(),
  },
  mock_campaign_api: {
    list_assets: vi.fn<(campaign_id: string) => Promise<UploadedAsset[]>>(),
  },
}))

vi.mock('../util/rest_client', () => ({
  asset_api: mock_asset_api,
  campaign_api: mock_campaign_api,
}))

import { asset_viewmodel } from './asset_viewmodel'

function make_uploaded_asset(overrides: Partial<UploadedAsset> = {}): UploadedAsset {
  return {
    id: 'asset-1',
    campaign_id: 'campaign-1',
    uploaded_by: 'user-1',
    label: 'Stone Tile',
    storage_path: '/assets/stone-tile.stl',
    grid_width: 1,
    grid_depth: 1,
    scale_factor: 1,
    asset_type: 'map_tile',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function make_stl_file(name = 'goblin.stl'): File {
  return new File(['stl-binary-content'], name, { type: 'application/octet-stream' })
}

function render_asset_viewmodel() {
  return renderHook(() => asset_viewmodel())
}

function render_asset_upload_form(campaign_id = 'campaign-1', on_upload_success?: () => void) {
  return renderHook(() => {
    const view_model = asset_viewmodel()
    return view_model.asset_upload_form_model(campaign_id, on_upload_success)
  })
}

beforeEach(() => {
  vi.resetAllMocks()
})

// This project's vitest.config.ts does not set `test.globals: true`, so
// @testing-library/react's automatic afterEach cleanup never registers. Without an
// explicit unmount here, a hook rendered by one test stays mounted, following the pattern
// in character_viewmodel.test.ts.
afterEach(() => {
  cleanup()
})

describe('uploadSTL', () => {
  it('appends the uploaded asset to uploaded_assets on success', async () => {
    const uploaded_asset = make_uploaded_asset()
    mock_asset_api.upload.mockResolvedValue(uploaded_asset)
    const { result } = render_asset_viewmodel()

    await act(async () => {
      await result.current.uploadSTL(make_stl_file(), 'Stone Tile', 'map_tile', 'campaign-1', {
        gridWidth: 2,
        gridDepth: 3,
        scaleFactor: 1.5,
      })
    })

    expect(mock_asset_api.upload).toHaveBeenCalledTimes(1)
    const form_data = mock_asset_api.upload.mock.calls[0][0]
    expect(form_data.get('label')).toBe('Stone Tile')
    expect(form_data.get('asset_type')).toBe('map_tile')
    expect(form_data.get('campaign_id')).toBe('campaign-1')
    expect(form_data.get('grid_width')).toBe('2')
    expect(form_data.get('grid_depth')).toBe('3')
    expect(form_data.get('scale_factor')).toBe('1.5')
    expect(result.current.uploaded_assets).toEqual([uploaded_asset])
    expect(result.current.uploading).toBe(false)
    expect(result.current.upload_error).toBeNull()
  })

  it('sets upload_error and rethrows on failure, leaving uploaded_assets untouched', async () => {
    mock_asset_api.upload.mockRejectedValue(new Error('upload failed'))
    const { result } = render_asset_viewmodel()

    // The rejection is awaited (and asserted) *inside* the act() callback, rather than
    // propagated out through act() itself, so React still gets a chance to flush the
    // set_upload_error/set_uploading state updates that happen before uploadSTL rethrows.
    await act(async () => {
      await expect(
        result.current.uploadSTL(make_stl_file(), 'Stone Tile', 'map_tile', 'campaign-1')
      ).rejects.toThrow('upload failed')
    })

    expect(result.current.upload_error).toBe('upload failed')
    expect(result.current.uploading).toBe(false)
    expect(result.current.uploaded_assets).toEqual([])
  })
})

describe('list_campaign_assets', () => {
  it('replaces uploaded_assets with the campaign assets returned by the API on success', async () => {
    const assets = [make_uploaded_asset({ id: 'asset-1' }), make_uploaded_asset({ id: 'asset-2' })]
    mock_campaign_api.list_assets.mockResolvedValue(assets)
    const { result } = render_asset_viewmodel()

    await act(async () => {
      await result.current.list_campaign_assets('campaign-1')
    })

    expect(mock_campaign_api.list_assets).toHaveBeenCalledWith('campaign-1')
    expect(result.current.uploaded_assets).toEqual(assets)
  })

  it('leaves uploaded_assets untouched when the API call fails', async () => {
    mock_campaign_api.list_assets.mockRejectedValue(new Error('network error'))
    const { result } = render_asset_viewmodel()

    await expect(
      act(async () => {
        await result.current.list_campaign_assets('campaign-1')
      })
    ).rejects.toThrow('network error')

    expect(result.current.uploaded_assets).toEqual([])
  })
})

describe('asset_upload_form_model validation', () => {
  it('requires a file to be selected', async () => {
    const { result } = render_asset_upload_form()

    await act(async () => {
      await result.current.on_submit_press()
    })

    expect(result.current.validation_error).toBe('Select an STL file to upload')
    expect(mock_asset_api.upload).not.toHaveBeenCalled()
  })

  it('rejects a non-.stl file extension', async () => {
    const { result } = render_asset_upload_form()

    act(() => {
      result.current.on_file_change({ target: { files: [make_stl_file('model.obj')] } } as unknown as React.ChangeEvent<HTMLInputElement>)
      result.current.on_label_change({ target: { value: 'Stone Tile' } } as React.ChangeEvent<HTMLInputElement>)
    })
    await act(async () => {
      await result.current.on_submit_press()
    })

    expect(result.current.validation_error).toBe('Only .stl files are supported')
    expect(mock_asset_api.upload).not.toHaveBeenCalled()
  })

  it('accepts an uppercase .STL extension (case-insensitive)', async () => {
    mock_asset_api.upload.mockResolvedValue(make_uploaded_asset())
    const { result } = render_asset_upload_form()

    act(() => {
      result.current.on_file_change({ target: { files: [make_stl_file('Model.STL')] } } as unknown as React.ChangeEvent<HTMLInputElement>)
      result.current.on_label_change({ target: { value: 'Stone Tile' } } as React.ChangeEvent<HTMLInputElement>)
    })
    await act(async () => {
      await result.current.on_submit_press()
    })

    expect(result.current.validation_error).toBeNull()
    expect(mock_asset_api.upload).toHaveBeenCalledTimes(1)
  })

  it('requires a non-empty label', async () => {
    const { result } = render_asset_upload_form()

    act(() => {
      result.current.on_file_change({ target: { files: [make_stl_file()] } } as unknown as React.ChangeEvent<HTMLInputElement>)
      result.current.on_label_change({ target: { value: '   ' } } as React.ChangeEvent<HTMLInputElement>)
    })
    await act(async () => {
      await result.current.on_submit_press()
    })

    expect(result.current.validation_error).toBe('Enter a label for this asset')
    expect(mock_asset_api.upload).not.toHaveBeenCalled()
  })

  it('rejects a fractional grid_width even though it is positive, since grid dimensions must be whole numbers', async () => {
    const { result } = render_asset_upload_form()

    act(() => {
      result.current.on_file_change({ target: { files: [make_stl_file()] } } as unknown as React.ChangeEvent<HTMLInputElement>)
      result.current.on_label_change({ target: { value: 'Stone Tile' } } as React.ChangeEvent<HTMLInputElement>)
      result.current.on_grid_width_change({ target: { value: '1.5' } } as React.ChangeEvent<HTMLInputElement>)
    })
    await act(async () => {
      await result.current.on_submit_press()
    })

    expect(result.current.validation_error).toBe('Grid width and depth must be positive whole numbers')
    expect(mock_asset_api.upload).not.toHaveBeenCalled()
  })

  it('rejects a zero grid_depth', async () => {
    const { result } = render_asset_upload_form()

    act(() => {
      result.current.on_file_change({ target: { files: [make_stl_file()] } } as unknown as React.ChangeEvent<HTMLInputElement>)
      result.current.on_label_change({ target: { value: 'Stone Tile' } } as React.ChangeEvent<HTMLInputElement>)
      result.current.on_grid_depth_change({ target: { value: '0' } } as React.ChangeEvent<HTMLInputElement>)
    })
    await act(async () => {
      await result.current.on_submit_press()
    })

    expect(result.current.validation_error).toBe('Grid width and depth must be positive whole numbers')
    expect(mock_asset_api.upload).not.toHaveBeenCalled()
  })

  it('accepts a fractional scale_factor, since scale only needs to be a positive number, not a whole one', async () => {
    mock_asset_api.upload.mockResolvedValue(make_uploaded_asset())
    const { result } = render_asset_upload_form()

    act(() => {
      result.current.on_file_change({ target: { files: [make_stl_file()] } } as unknown as React.ChangeEvent<HTMLInputElement>)
      result.current.on_label_change({ target: { value: 'Stone Tile' } } as React.ChangeEvent<HTMLInputElement>)
      result.current.on_scale_factor_change({ target: { value: '0.5' } } as React.ChangeEvent<HTMLInputElement>)
    })
    await act(async () => {
      await result.current.on_submit_press()
    })

    expect(result.current.validation_error).toBeNull()
    const form_data = mock_asset_api.upload.mock.calls[0][0]
    expect(form_data.get('scale_factor')).toBe('0.5')
  })

  it('rejects a zero scale_factor', async () => {
    const { result } = render_asset_upload_form()

    act(() => {
      result.current.on_file_change({ target: { files: [make_stl_file()] } } as unknown as React.ChangeEvent<HTMLInputElement>)
      result.current.on_label_change({ target: { value: 'Stone Tile' } } as React.ChangeEvent<HTMLInputElement>)
      result.current.on_scale_factor_change({ target: { value: '0' } } as React.ChangeEvent<HTMLInputElement>)
    })
    await act(async () => {
      await result.current.on_submit_press()
    })

    expect(result.current.validation_error).toBe('Scale factor must be a positive number')
    expect(mock_asset_api.upload).not.toHaveBeenCalled()
  })
})

describe('asset_upload_form_model submit flow', () => {
  it('resets the form, bumps file_input_reset_key, and fires on_upload_success after a successful upload', async () => {
    mock_asset_api.upload.mockResolvedValue(make_uploaded_asset())
    const on_upload_success = vi.fn()
    const { result } = render_asset_upload_form('campaign-1', on_upload_success)

    act(() => {
      result.current.on_file_change({ target: { files: [make_stl_file()] } } as unknown as React.ChangeEvent<HTMLInputElement>)
      result.current.on_label_change({ target: { value: 'Stone Tile' } } as React.ChangeEvent<HTMLInputElement>)
      result.current.on_grid_width_change({ target: { value: '3' } } as React.ChangeEvent<HTMLInputElement>)
    })
    const reset_key_before_submit = result.current.file_input_reset_key

    await act(async () => {
      await result.current.on_submit_press()
    })

    expect(result.current.selected_file).toBeNull()
    expect(result.current.label_draft).toBe('')
    expect(result.current.grid_width_draft).toBe('1')
    expect(result.current.file_input_reset_key).toBe(reset_key_before_submit + 1)
    expect(on_upload_success).toHaveBeenCalledTimes(1)
  })

  it('surfaces the upload error and leaves the draft values intact when the upload fails', async () => {
    mock_asset_api.upload.mockRejectedValue(new Error('server rejected the upload'))
    const on_upload_success = vi.fn()
    const { result } = render_asset_upload_form('campaign-1', on_upload_success)

    act(() => {
      result.current.on_file_change({ target: { files: [make_stl_file()] } } as unknown as React.ChangeEvent<HTMLInputElement>)
      result.current.on_label_change({ target: { value: 'Stone Tile' } } as React.ChangeEvent<HTMLInputElement>)
    })

    await act(async () => {
      await result.current.on_submit_press()
    })

    await waitFor(() => expect(result.current.upload_error).toBe('server rejected the upload'))
    expect(result.current.label_draft).toBe('Stone Tile')
    expect(result.current.selected_file).not.toBeNull()
    expect(on_upload_success).not.toHaveBeenCalled()
  })
})
