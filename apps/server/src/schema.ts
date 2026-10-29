export const migration=`
PRAGMA foreign_keys = ON;
PRAGMA secure_delete = ON;
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS users (
 twitch_id TEXT PRIMARY KEY, login TEXT NOT NULL COLLATE NOCASE, display_name TEXT NOT NULL,
 first_seen INTEGER NOT NULL, pitches INTEGER NOT NULL DEFAULT 0, games_approved INTEGER NOT NULL DEFAULT 0, beats INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS users_login ON users(login);
CREATE TABLE IF NOT EXISTS pitches (
 id INTEGER PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(twitch_id) ON DELETE CASCADE,
 text TEXT NOT NULL, created_at INTEGER NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('received','filtered','queued','building','built','failed','approved','rejected')),
 reason TEXT, moderation_json TEXT, role TEXT NOT NULL DEFAULT 'viewer', priority INTEGER NOT NULL DEFAULT 4,
 message_id TEXT NOT NULL UNIQUE
);
CREATE INDEX IF NOT EXISTS queue_order ON pitches(status,priority,id);
CREATE TABLE IF NOT EXISTS builds (
 id INTEGER PRIMARY KEY, pitch_id INTEGER NOT NULL REFERENCES pitches(id) ON DELETE CASCADE,
 codex_thread_id TEXT, model TEXT, started_at INTEGER NOT NULL, ended_at INTEGER,
 playtests INTEGER NOT NULL DEFAULT 0, tokens_in INTEGER, tokens_out INTEGER, status TEXT NOT NULL, log_path TEXT, receipt_json TEXT
);
CREATE TABLE IF NOT EXISTS games (
 id INTEGER PRIMARY KEY, pitch_id INTEGER UNIQUE REFERENCES pitches(id) ON DELETE CASCADE,
 spec_json TEXT NOT NULL, title TEXT NOT NULL, verb TEXT NOT NULL,
 author_id TEXT REFERENCES users(twitch_id) ON DELETE CASCADE, report_json TEXT NOT NULL, difficulty REAL NOT NULL,
 approved_by TEXT, approved_at INTEGER, classic INTEGER NOT NULL DEFAULT 0,
 status TEXT NOT NULL DEFAULT 'built' CHECK(status IN ('built','approved','rejected')), seed_key TEXT UNIQUE, receipt_json TEXT
);
CREATE TABLE IF NOT EXISTS gauntlets (
 id INTEGER PRIMARY KEY, started_at INTEGER NOT NULL, ended_at INTEGER, lives_left INTEGER NOT NULL, score INTEGER NOT NULL DEFAULT 0, marker_id TEXT
);
CREATE TABLE IF NOT EXISTS plays (
 id INTEGER PRIMARY KEY, gauntlet_id INTEGER NOT NULL REFERENCES gauntlets(id) ON DELETE CASCADE,
 game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE, position INTEGER NOT NULL,
 outcome TEXT NOT NULL CHECK(outcome IN ('win','lose','skip')), ms INTEGER NOT NULL, clip_id TEXT, clip_url TEXT
);
CREATE TABLE IF NOT EXISTS round_scores (
 play_id INTEGER PRIMARY KEY REFERENCES plays(id) ON DELETE CASCADE,
 player_points INTEGER NOT NULL, designer_points INTEGER NOT NULL, combo INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS gauntlet_players (
 gauntlet_id INTEGER PRIMARY KEY REFERENCES gauntlets(id) ON DELETE CASCADE,
 login TEXT NOT NULL, simulated INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
 id INTEGER PRIMARY KEY, ts INTEGER NOT NULL, type TEXT NOT NULL, payload_json TEXT NOT NULL,
 user_id TEXT REFERENCES users(twitch_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY,value TEXT NOT NULL);
`;
