#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';

const distDir = 'dist';

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('Created dist directory');
}

const toolsSource = path.join(distDir, 'tools-generated.json');

if (fs.existsSync(toolsSource)) {
  console.log('tools-generated.json already exists in dist/');
} else {
  console.log('tools-generated.json not found - run yarn generate-tools first');
}

console.log('Prebuild complete');
