CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at NUMBER NOT NULL,
    api_key TEXT NOT NULL,
    state_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS db_info (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT INTO db_info VALUES ('version', '1');
