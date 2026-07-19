import { useCallback, useState } from 'react'
import { asset_api } from '../util/rest_client'
import { UploadedAsset } from '../types/game_types'

export function asset_viewmodel() {
  const [uploaded_assets, set_uploaded_assets] = useState<UploadedAsset[]>([])
  const [uploading, set_uploading] = useState(false)
  const [upload_error, set_upload_error] = useState<string | null>(null)

  /** Upload an STL file as either a map_tile or mini asset. */
  const uploadSTL = useCallback(
    async (
      file: File,
      label: string,
      assetType: 'map_tile' | 'mini',
      campaignID: string,
      options?: { gridWidth?: number; gridDepth?: number; scaleFactor?: number }
    ) => {
      set_uploading(true)
      set_upload_error(null)
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('label', label)
        formData.append('asset_type', assetType)
        formData.append('campaign_id', campaignID)
        if (options?.gridWidth != null) formData.append('grid_width', String(options.gridWidth))
        if (options?.gridDepth != null) formData.append('grid_depth', String(options.gridDepth))
        if (options?.scaleFactor != null) formData.append('scale_factor', String(options.scaleFactor))

        const asset = await asset_api.upload(formData)
        set_uploaded_assets((prev) => [...prev, asset])
      } catch (err) {
        set_upload_error(err instanceof Error ? err.message : 'Upload failed')
        throw err
      } finally {
        set_uploading(false)
      }
    },
    []
  )

  const getAssetUrl = useCallback((assetID: string) => asset_api.getUrl(assetID), [])

  /** DM: upload form state for adding a custom STL tile/mini — file, label, asset_type,
   *  and placement dimensions, with client-side validation before handing off to
   *  uploadSTL. file_input_reset_key is bumped after a successful upload to force the
   *  (uncontrollable) native file input to remount and clear its selected file. */
  function asset_upload_form_model(campaign_id: string) {
    const [selected_file, set_selected_file] = useState<File | null>(null)
    const [label_draft, set_label_draft] = useState('')
    const [asset_type_draft, set_asset_type_draft] = useState<'map_tile' | 'mini'>('map_tile')
    const [grid_width_draft, set_grid_width_draft] = useState('1')
    const [grid_depth_draft, set_grid_depth_draft] = useState('1')
    const [scale_factor_draft, set_scale_factor_draft] = useState('1')
    const [validation_error, set_validation_error] = useState<string | null>(null)
    const [file_input_reset_key, set_file_input_reset_key] = useState(0)

    const on_file_change = (event: React.ChangeEvent<HTMLInputElement>) => {
      set_selected_file(event.target.files?.[0] ?? null)
      if (validation_error) set_validation_error(null)
    }

    const on_label_change = (event: React.ChangeEvent<HTMLInputElement>) => {
      set_label_draft(event.target.value)
      if (validation_error) set_validation_error(null)
    }

    const on_asset_type_change = (event: React.ChangeEvent<HTMLSelectElement>) => {
      set_asset_type_draft(event.target.value as 'map_tile' | 'mini')
    }

    const on_grid_width_change = (event: React.ChangeEvent<HTMLInputElement>) => {
      set_grid_width_draft(event.target.value)
      if (validation_error) set_validation_error(null)
    }

    const on_grid_depth_change = (event: React.ChangeEvent<HTMLInputElement>) => {
      set_grid_depth_draft(event.target.value)
      if (validation_error) set_validation_error(null)
    }

    const on_scale_factor_change = (event: React.ChangeEvent<HTMLInputElement>) => {
      set_scale_factor_draft(event.target.value)
      if (validation_error) set_validation_error(null)
    }

    const on_submit_press = async () => {
      if (!selected_file) {
        set_validation_error('Select an STL file to upload')
        return
      }
      if (!selected_file.name.toLowerCase().endsWith('.stl')) {
        set_validation_error('Only .stl files are supported')
        return
      }
      const trimmed_label = label_draft.trim()
      if (!trimmed_label) {
        set_validation_error('Enter a label for this asset')
        return
      }

      const grid_width = Number(grid_width_draft)
      const grid_depth = Number(grid_depth_draft)
      const scale_factor = Number(scale_factor_draft)
      const is_positive_integer = (value: number) => Number.isInteger(value) && value > 0
      const is_positive_number = (value: number) => Number.isFinite(value) && value > 0

      if (!is_positive_integer(grid_width) || !is_positive_integer(grid_depth)) {
        set_validation_error('Grid width and depth must be positive whole numbers')
        return
      }
      if (!is_positive_number(scale_factor)) {
        set_validation_error('Scale factor must be a positive number')
        return
      }

      set_validation_error(null)
      try {
        await uploadSTL(selected_file, trimmed_label, asset_type_draft, campaign_id, {
          gridWidth: grid_width,
          gridDepth: grid_depth,
          scaleFactor: scale_factor,
        })
        set_selected_file(null)
        set_label_draft('')
        set_grid_width_draft('1')
        set_grid_depth_draft('1')
        set_scale_factor_draft('1')
        set_file_input_reset_key((previous_key) => previous_key + 1)
      } catch {
        // upload_error is already set by uploadSTL — nothing further to do here.
      }
    }

    return {
      selected_file,
      label_draft,
      asset_type_draft,
      grid_width_draft,
      grid_depth_draft,
      scale_factor_draft,
      validation_error,
      file_input_reset_key,
      uploading,
      upload_error,
      on_file_change,
      on_label_change,
      on_asset_type_change,
      on_grid_width_change,
      on_grid_depth_change,
      on_scale_factor_change,
      on_submit_press,
    }
  }

  return {
    uploaded_assets,
    uploading,
    upload_error,
    uploadSTL,
    getAssetUrl,
    asset_upload_form_model,
  }
}
