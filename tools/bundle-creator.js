#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import { resolve, join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('Bundle Creator for Capacitor Native Update');
console.log('=========================================\n');

const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  showHelp();
  process.exit(0);
}

async function createBundle(distPath, outputPath) {
  if (!existsSync(distPath)) {
    console.error(`Error: Directory ${distPath} does not exist`);
    process.exit(1);
  }

  try {
    console.log(`Creating bundle from: ${distPath}`);
    
    // Create zip
    const zipName = outputPath || `bundle-${Date.now()}.zip`;
    await execAsync(`cd "${distPath}" && zip -r "../${zipName}" .`);
    
    // Calculate checksum
    const bundleData = readFileSync(zipName);
    const checksum = createHash('sha256').update(bundleData).digest('hex');
    
    // Create manifest
    const manifest = {
      version: new Date().toISOString(),
      checksum,
      size: bundleData.length,
      created: new Date().toISOString()
    };
    
    writeFileSync(`${zipName}.manifest.json`, JSON.stringify(manifest, null, 2));
    
    console.log(`\nBundle created successfully!`);
    console.log(`Bundle: ${zipName}`);
    console.log(`Checksum: ${checksum}`);
    console.log(`Size: ${bundleData.length} bytes`);
    
  } catch (error) {
    console.error('Error creating bundle:', error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log('Usage: bundle-creator <command> [options]\n');
  console.log('Commands:');
  console.log('  create <dist-path> [output-name]  Create bundle from dist directory');
  console.log('  help                              Show this help message');
  console.log('\nExample:');
  console.log('  bundle-creator create ./dist my-app-v1.0.0.zip');
}

// Handle commands
switch (command) {
  case 'create':
    const distPath = args[1];
    const outputPath = args[2];
    if (!distPath) {
      console.error('Error: Please specify dist directory path');
      showHelp();
      process.exit(1);
    }
    createBundle(distPath, outputPath);
    break;
  
  case 'help':
    showHelp();
    break;
    
  default:
    console.error(`Unknown command: ${command}`);
    showHelp();
    process.exit(1);
}