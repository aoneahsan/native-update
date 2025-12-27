#!/usr/bin/env node

import dotenv from 'dotenv';
import { initDatabase } from '../src/database/init.js';
import { db } from '../src/database/init.js';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

// Load environment variables
dotenv.config();

console.log('Initializing database...');

async function setup() {
  try {
    // Initialize database schema
    await initDatabase();
    console.log('✅ Database schema created');

    // Create default admin user
    const adminPassword = process.env.ADMIN_PASSWORD || 'changeme';
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

    // Create default API key for testing
    const defaultApiKey = `cap_${nanoid(32)}`;
    const apiKeyHash = await bcrypt.hash(defaultApiKey, 10);

    db.prepare(`
      INSERT OR IGNORE INTO api_keys (id, name, key_hash, permissions)
      VALUES (?, ?, ?, ?)
    `).run(
      'default-key',
      'Default API Key',
      apiKeyHash,
      'read,write'
    );

    console.log('✅ Default API key created');
    console.log('');
    console.log('========================================');
    console.log('Setup completed successfully!');
    console.log('');
    console.log('Default API Key (save this, it won\'t be shown again):');
    console.log(defaultApiKey);
    console.log('');
    console.log('Admin Password:', adminPassword);
    console.log('');
    console.log('⚠️  IMPORTANT: Change these credentials before deploying to production!');
    console.log('========================================');

    // Create sample data in development
    if (process.env.NODE_ENV === 'development') {
      console.log('\nCreating sample data for development...');

      // Create sample update
      const updateId = nanoid();
      db.prepare(`
        INSERT INTO updates (id, app_id, platform, version, channel, description, release_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        updateId,
        'com.example.app',
        'web',
        '1.0.1',
        'production',
        'Bug fixes and improvements',
        '- Fixed login issue\n- Improved performance\n- Updated dependencies'
      );

      console.log('✅ Sample update created');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setup();