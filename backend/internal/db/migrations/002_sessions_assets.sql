-- +goose Up
CREATE TABLE sessions (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id   UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    active_map_id UUID REFERENCES maps(id) ON DELETE SET NULL,
    started_at    TIMESTAMPTZ DEFAULT NOW(),
    ended_at      TIMESTAMPTZ
);

CREATE TABLE uploaded_assets (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id  UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    label        TEXT NOT NULL DEFAULT '',
    storage_path TEXT NOT NULL,
    grid_width   INT NOT NULL DEFAULT 1,
    grid_depth   INT NOT NULL DEFAULT 1,
    scale_factor FLOAT NOT NULL DEFAULT 1.0,
    asset_type   TEXT NOT NULL, -- "map_tile" | "mini"
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS uploaded_assets;
DROP TABLE IF EXISTS sessions;
