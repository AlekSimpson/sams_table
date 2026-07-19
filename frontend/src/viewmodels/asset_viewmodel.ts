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

  return {
    uploaded_assets,
    uploading,
    upload_error,
    uploadSTL,
    getAssetUrl,
  }
}
