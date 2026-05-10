-- +goose Up
ALTER TABLE characters ALTER COLUMN campaign_id DROP NOT NULL;

-- +goose Down
ALTER TABLE characters ALTER COLUMN campaign_id SET NOT NULL;
