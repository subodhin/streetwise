PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS zones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    polygon TEXT,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'paused')),
    pause_reason TEXT,
    paused_until TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL
        CHECK (length(text) BETWEEN 10 AND 500),
    lat REAL NOT NULL CHECK (lat BETWEEN -90 AND 90),
    lng REAL NOT NULL CHECK (lng BETWEEN -180 AND 180),
    photo TEXT,
    type TEXT NOT NULL CHECK (
        type IN (
            'pothole',
            'street_light',
            'flooding',
            'rubbish',
            'not_relevant'
        )
    ),
    size TEXT NOT NULL CHECK (
        size IN ('small', 'medium', 'large')
    ),
    priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 5),
    zone TEXT NOT NULL,
    confidence REAL NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    reason TEXT NOT NULL,
    route TEXT NOT NULL CHECK (
        route IN ('publish', 'needs_approval', 'reject')
    ),
    triaged_by TEXT NOT NULL CHECK (
        triaged_by IN ('model', 'rules')
    ),
    status TEXT NOT NULL DEFAULT 'received' CHECK (
        status IN (
            'received',
            'needs_review',
            'published',
            'in_progress',
            'fixed',
            'rejected',
            'merged'
        )
    ),
    merged_into TEXT,
    follow_token_hash TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (zone) REFERENCES zones(id),
    FOREIGN KEY (merged_into) REFERENCES reports(id)
);

CREATE TABLE IF NOT EXISTS report_events (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (report_id) REFERENCES reports(id)
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('staff', 'admin')),
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reports_status_priority
    ON reports(status, priority DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_reports_zone_status
    ON reports(zone, status);

CREATE INDEX IF NOT EXISTS idx_reports_created_at
    ON reports(created_at);

CREATE INDEX IF NOT EXISTS idx_report_events_report
    ON report_events(report_id, created_at);