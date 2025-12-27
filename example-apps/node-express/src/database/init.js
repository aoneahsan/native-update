import Database from 'better-sqlite3';
import path from 'path';
import { logger } from '../utils/logger.js';

const dbPath = process.env.DB_PATH || './data/updates.db';

export const db = new Database(dbPath, {
  verbose: process.env.NODE_ENV === 'development' ? logger.debug : null,
});

// Enable foreign keys
db.pragma('foreign_keys = ON');

export async function initDatabase() {
  try {
    // Create tables
    db.exec(`
      -- Updates table
      CREATE TABLE IF NOT EXISTS updates (
        id TEXT PRIMARY KEY,
        app_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        version TEXT NOT NULL,
        channel TEXT NOT NULL DEFAULT 'production',
        min_app_version TEXT,
        max_app_version TEXT,
        description TEXT,
        release_notes TEXT,
        mandatory BOOLEAN DEFAULT 0,
        enabled BOOLEAN DEFAULT 1,
        rollout_percentage INTEGER DEFAULT 100,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(app_id, platform, version, channel)
      );

      -- Bundles table
      CREATE TABLE IF NOT EXISTS bundles (
        id TEXT PRIMARY KEY,
        update_id TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        checksum TEXT NOT NULL,
        signature TEXT,
        download_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (update_id) REFERENCES updates(id) ON DELETE CASCADE
      );

      -- Download stats
      CREATE TABLE IF NOT EXISTS download_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bundle_id TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        success BOOLEAN DEFAULT 1,
        error_message TEXT,
        FOREIGN KEY (bundle_id) REFERENCES bundles(id) ON DELETE CASCADE
      );

      -- Analytics events
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        version TEXT,
        platform TEXT,
        device_id TEXT,
        session_id TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- API keys for authentication
      CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        key_hash TEXT NOT NULL UNIQUE,
        permissions TEXT NOT NULL DEFAULT 'read',
        last_used DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_updates_lookup 
        ON updates(app_id, platform, channel, enabled);
      
      CREATE INDEX IF NOT EXISTS idx_events_lookup 
        ON events(app_id, event_type, created_at);
      
      CREATE INDEX IF NOT EXISTS idx_downloads_bundle 
        ON download_stats(bundle_id, downloaded_at);
    `);

    // Create views
    db.exec(`
      -- Update statistics view
      CREATE VIEW IF NOT EXISTS update_statistics AS
      SELECT 
        u.id,
        u.app_id,
        u.platform,
        u.version,
        u.channel,
        COUNT(DISTINCT ds.id) as download_count,
        COUNT(DISTINCT CASE WHEN ds.success = 1 THEN ds.id END) as success_count,
        u.created_at
      FROM updates u
      LEFT JOIN bundles b ON u.id = b.update_id
      LEFT JOIN download_stats ds ON b.id = ds.bundle_id
      GROUP BY u.id;

      -- Daily analytics view
      CREATE VIEW IF NOT EXISTS daily_analytics AS
      SELECT 
        DATE(created_at) as date,
        app_id,
        event_type,
        COUNT(*) as event_count
      FROM events
      GROUP BY DATE(created_at), app_id, event_type;
    `);

    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

// Prepared statements for common operations
export const statements = {
  // Updates
  createUpdate: db.prepare(`
    INSERT INTO updates (id, app_id, platform, version, channel, min_app_version, 
                        max_app_version, description, release_notes, mandatory, 
                        rollout_percentage)
    VALUES (@id, @app_id, @platform, @version, @channel, @min_app_version, 
            @max_app_version, @description, @release_notes, @mandatory, 
            @rollout_percentage)
  `),

  getLatestUpdate: db.prepare(`
    SELECT u.*, b.id as bundle_id, b.download_url, b.checksum, b.signature, b.file_size
    FROM updates u
    JOIN bundles b ON u.id = b.update_id
    WHERE u.app_id = @app_id 
      AND u.platform = @platform 
      AND u.channel = @channel
      AND u.enabled = 1
      AND u.version > @current_version
    ORDER BY u.version DESC
    LIMIT 1
  `),

  // Bundles
  createBundle: db.prepare(`
    INSERT INTO bundles (id, update_id, file_path, file_size, checksum, signature, download_url)
    VALUES (@id, @update_id, @file_path, @file_size, @checksum, @signature, @download_url)
  `),

  // Analytics
  recordEvent: db.prepare(`
    INSERT INTO events (app_id, event_type, version, platform, device_id, session_id, metadata)
    VALUES (@app_id, @event_type, @version, @platform, @device_id, @session_id, @metadata)
  `),

  recordDownload: db.prepare(`
    INSERT INTO download_stats (bundle_id, ip_address, user_agent, success, error_message)
    VALUES (@bundle_id, @ip_address, @user_agent, @success, @error_message)
  `),
};

export default db;