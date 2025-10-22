#!/usr/bin/env node

/**
 * Script to check if required environment variables are set
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
};

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

function checkEnvFile() {
  const envFiles = ['.env.local', '.env'];
  const projectRoot = resolve(__dirname, '..');

  let envFileExists = false;
  let foundEnvFile = null;

  for (const file of envFiles) {
    const envPath = resolve(projectRoot, file);
    if (existsSync(envPath)) {
      envFileExists = true;
      foundEnvFile = file;
      break;
    }
  }

  if (!envFileExists) {
    console.log(`\n${colors.yellow}⚠️  Warning: No environment file found${colors.reset}`);
    console.log(`${colors.cyan}ℹ️  Please create a .env.local file with the following variables:${colors.reset}\n`);
    requiredEnvVars.forEach(varName => {
      console.log(`   ${varName}=your_value_here`);
    });
    console.log(`\n${colors.cyan}ℹ️  You can copy .env.example if it exists${colors.reset}\n`);
  } else {
    console.log(`${colors.green}✓ Found environment file: ${foundEnvFile}${colors.reset}`);
  }
}

function checkEnvVars() {
  const missingVars = [];

  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.log(`\n${colors.yellow}⚠️  Warning: The following environment variables are not set:${colors.reset}\n`);
    missingVars.forEach(varName => {
      console.log(`   ${colors.red}✗${colors.reset} ${varName}`);
    });
    console.log(`\n${colors.cyan}ℹ️  The application may not work correctly without these variables.${colors.reset}`);
    console.log(`${colors.cyan}ℹ️  Add them to your .env.local file.${colors.reset}\n`);
  } else {
    console.log(`${colors.green}✓ All required environment variables are set${colors.reset}\n`);
  }
}

// Run checks
console.log(`\n${colors.cyan}Checking environment configuration...${colors.reset}\n`);
checkEnvFile();
checkEnvVars();
