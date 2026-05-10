-- +goose Up
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username      TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaigns (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    dm_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE characters (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id   UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    player_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    name          TEXT NOT NULL,
    class         TEXT NOT NULL DEFAULT '',
    race          TEXT NOT NULL DEFAULT '',
    level         INT NOT NULL DEFAULT 1,
    max_hp        INT NOT NULL DEFAULT 10,
    current_hp    INT NOT NULL DEFAULT 10,
    armor_class   INT NOT NULL DEFAULT 10,
    speed         INT NOT NULL DEFAULT 30,
    stats         JSONB NOT NULL DEFAULT '{}',
    saving_throws JSONB NOT NULL DEFAULT '{}',
    skills        JSONB NOT NULL DEFAULT '{}',
    conditions    TEXT[] NOT NULL DEFAULT '{}',
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE maps (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    grid_width  INT NOT NULL DEFAULT 30,
    grid_height INT NOT NULL DEFAULT 30,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE map_tiles (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    map_id       UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    asset_id     TEXT NOT NULL,
    asset_source TEXT NOT NULL DEFAULT 'default', -- "default" | "uploaded"
    grid_x       INT NOT NULL,
    grid_y       INT NOT NULL,
    grid_z       INT NOT NULL,
    rotation_y   FLOAT NOT NULL DEFAULT 0,
    UNIQUE(map_id, grid_x, grid_y, grid_z)
);

-- +goose Down
DROP TABLE IF EXISTS map_tiles;
DROP TABLE IF EXISTS maps;
DROP TABLE IF EXISTS characters;
DROP TABLE IF EXISTS campaigns;
DROP TABLE IF EXISTS users;
