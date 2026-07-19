// VIEW layer — DM form to upload a custom STL tile/mini for a campaign (standalone;
// not yet mounted into a route — a future ticket wires this into the asset catalogue).
import { asset_viewmodel } from '../viewmodels/asset_viewmodel'
import { Button, Card, Input } from './components'
import '../../styles/asset_upload_form.css'

interface AssetUploadFormProps {
  campaign_id: string
}

export default function AssetUploadForm({ campaign_id }: AssetUploadFormProps) {
  const asset = asset_viewmodel()
  const model = asset.asset_upload_form_model(campaign_id)

  return (
    <Card className="asset-upload-form">
      <span className="section-label">Upload Asset</span>

      <label className="input-field" htmlFor="asset-upload-file-input">
        <span className="input-field__label">STL File</span>
        <input
          key={model.file_input_reset_key}
          id="asset-upload-file-input"
          type="file"
          accept=".stl"
          className="input asset-upload-form__file-input"
          onChange={model.on_file_change}
          disabled={model.uploading}
        />
      </label>

      <Input
        id="asset-upload-label-input"
        label="Label"
        type="text"
        placeholder="Asset name"
        value={model.label_draft}
        onChange={model.on_label_change}
        disabled={model.uploading}
      />

      <label className="input-field" htmlFor="asset-upload-type-select">
        <span className="input-field__label">Asset Type</span>
        <select
          id="asset-upload-type-select"
          className="input"
          value={model.asset_type_draft}
          onChange={model.on_asset_type_change}
          disabled={model.uploading}
        >
          <option value="map_tile">Map Tile</option>
          <option value="mini">Mini</option>
        </select>
      </label>

      <div className="asset-upload-form__grid-fields">
        <Input
          id="asset-upload-grid-width-input"
          label="Grid Width"
          type="number"
          min={1}
          step={1}
          value={model.grid_width_draft}
          onChange={model.on_grid_width_change}
          disabled={model.uploading}
        />
        <Input
          id="asset-upload-grid-depth-input"
          label="Grid Depth"
          type="number"
          min={1}
          step={1}
          value={model.grid_depth_draft}
          onChange={model.on_grid_depth_change}
          disabled={model.uploading}
        />
        <Input
          id="asset-upload-scale-factor-input"
          label="Scale Factor"
          type="number"
          min={0}
          step="any"
          value={model.scale_factor_draft}
          onChange={model.on_scale_factor_change}
          disabled={model.uploading}
        />
      </div>

      {model.validation_error && (
        <span className="asset-upload-form__error" role="alert">{model.validation_error}</span>
      )}

      {!model.validation_error && model.upload_error && (
        <span className="asset-upload-form__error" role="alert">{model.upload_error}</span>
      )}

      <Button
        variant="primary"
        size="small"
        onClick={model.on_submit_press}
        disabled={model.uploading}
      >
        {model.uploading ? 'Uploading…' : 'Upload Asset'}
      </Button>
    </Card>
  )
}
