-- +goose Up
CREATE TABLE attacks (
    id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name   TEXT NOT NULL,
    range  INT  NOT NULL,
    dc     INT  NOT NULL,
    damage INT  NOT NULL
);

-- +goose Down
DROP TABLE attacks;
