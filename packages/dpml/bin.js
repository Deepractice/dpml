#!/usr/bin/env node

/**
 * DPML CLI Entry Point
 * Redirects to @dpml/cli package
 */

import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, resolve } from 'path';

const require = createRequire(import.meta.url);

try {
  // Try to load through package name - for production environment
  const cliPath = require.resolve('@dpml/cli');
  const binPath = cliPath.replace(/[\\/]dist[\\/]index\.cjs$|[\\/]dist[\\/]index\.js$/, '/dist/bin.js');
  // 使用pathToFileURL转换路径以兼容Windows
  await import(pathToFileURL(binPath).href);
} catch (error) {
  try {
    // If not found, try to load from workspace path - for development environment
    // 使用ESM风格的相对路径
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const workspaceBinPath = resolve(__dirname, '../cli/dist/bin.js');
    // 使用pathToFileURL转换路径以兼容Windows
    await import(pathToFileURL(workspaceBinPath).href);
  } catch (fallbackError) {
    console.error('DPML CLI loading failed:', error.message);
    console.error('Please make sure @dpml/cli package is installed and built');
    process.exit(1);
  }
} 