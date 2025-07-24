#!/usr/bin/env node

/**
 * Test script to validate publishing setup without actually publishing
 * This simulates the key steps that the GitHub workflows perform
 */

import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

console.log('🧪 Testing npm publishing setup...\n');

const errors = [];
const warnings = [];

function logStep(message) {
  console.log(`✓ ${message}`);
}

function logError(message) {
  console.log(`❌ ${message}`);
  errors.push(message);
}

function logWarning(message) {
  console.log(`⚠️  ${message}`);
  warnings.push(message);
}

try {
  // Test 1: Check package.json exists and is valid
  logStep('Checking package.json...');
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const packageName = packageJson.name;
  const currentVersion = packageJson.version;
  
  if (!packageName) {
    logError('package.json missing "name" field');
  }
  
  if (!currentVersion) {
    logError('package.json missing "version" field');
  }
  
  logStep(`Package: ${packageName}@${currentVersion}`);

  // Test 2: Check required npm scripts exist
  logStep('Checking npm scripts...');
  const requiredScripts = ['build', 'test'];
  const optionalScripts = ['lint'];
  
  for (const script of requiredScripts) {
    if (!packageJson.scripts?.[script]) {
      logError(`Missing required npm script: "${script}"`);
    } else {
      logStep(`Found required script: ${script}`);
    }
  }
  
  for (const script of optionalScripts) {
    if (!packageJson.scripts?.[script]) {
      logWarning(`Missing optional npm script: "${script}" (workflow will continue without it)`);
    } else {
      logStep(`Found optional script: ${script}`);
    }
  }

  // Test 3: Test npm install
  logStep('Testing npm install...');
  try {
    execSync('npm ci', { stdio: 'pipe' });
    logStep('npm ci successful');
  } catch (error) {
    logError('npm ci failed - check your package-lock.json and dependencies');
  }

  // Test 4: Test build
  if (packageJson.scripts?.build) {
    logStep('Testing build...');
    try {
      execSync('npm run build', { stdio: 'pipe' });
      logStep('Build successful');
    } catch (error) {
      logError('Build failed - fix build errors before publishing');
    }
  }

  // Test 5: Test tests
  if (packageJson.scripts?.test) {
    logStep('Testing test suite...');
    try {
      execSync('npm test', { stdio: 'pipe' });
      logStep('Tests passed');
    } catch (error) {
      logError('Tests failed - fix failing tests before publishing');
    }
  }

  // Test 6: Test package contents
  logStep('Testing package contents...');
  try {
    const packOutput = execSync('npm pack --dry-run', { stdio: 'pipe' });
    logStep('Package contents look good');
    
    // Check if dist directory exists (common for TypeScript projects)
    if (packageJson.main?.includes('dist/') && !fs.existsSync('dist')) {
      logError('package.json references dist/ but dist directory not found - run npm run build first');
    }
  } catch (error) {
    logError('npm pack failed - check your package.json files field');
  }

  // Test 7: Check current published version
  logStep('Checking currently published version...');
  try {
    const publishedVersion = execSync(`npm view ${packageName} version`, { encoding: 'utf8' }).trim();
    logStep(`Currently published version: ${publishedVersion}`);
    
    if (publishedVersion === currentVersion) {
      logWarning(`Current version ${currentVersion} is already published - you'll need to bump the version to publish`);
    } else {
      logStep(`Version ${currentVersion} is ready to publish`);
    }
  } catch (error) {
    if (error.message.includes('404')) {
      logStep('Package not yet published - ready for first publish');
    } else {
      logWarning('Could not check published version - you may need to login to npm');
    }
  }

  // Test 8: Check workflow files
  logStep('Checking GitHub workflow files...');
  const workflowFiles = [
    '.github/workflows/publish.yml',
    '.github/workflows/manual-publish.yml'
  ];
  
  for (const file of workflowFiles) {
    if (fs.existsSync(file)) {
      logStep(`Found workflow: ${file}`);
    } else {
      logError(`Missing workflow file: ${file}`);
    }
  }

  // Test 9: Check if user is logged in to npm (for local publishing)
  logStep('Checking npm authentication...');
  try {
    const whoami = execSync('npm whoami', { encoding: 'utf8' }).trim();
    logStep(`Logged in to npm as: ${whoami}`);
  } catch (error) {
    logWarning('Not logged in to npm - this is fine for GitHub Actions publishing');
  }

  // Summary
  console.log('\n📋 Test Summary:');
  console.log(`✅ ${errors.length === 0 ? 'All checks passed!' : 'Some checks failed'}`);
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Errors that need to be fixed:');
    errors.forEach(error => console.log(`   - ${error}`));
    console.log('\nPlease fix these errors before attempting to publish.');
    process.exit(1);
  } else {
    console.log('\n🎉 Your setup looks good! You should be able to publish using GitHub Actions.');
    console.log('\nNext steps:');
    console.log('1. Make sure NPM_TOKEN is set in your GitHub repository secrets');
    console.log('2. Create a GitHub release to trigger automatic publishing');
    console.log('3. Or use the manual publish workflow in GitHub Actions');
  }

} catch (error) {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
}