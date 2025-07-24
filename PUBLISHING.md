# NPM Publishing Setup Instructions

This repository is configured for semi-automated publishing to npmjs.com when GitHub releases are created. The workflows support npm 2FA authentication with interactive OTP (One-Time Password) entry.

## Overview

There are three ways to publish this package:

1. **Automatic Publishing** (Recommended): Create a GitHub release → automatic publishing
2. **Manual Publishing with Version Bump**: Use GitHub Actions to manually publish with automatic version bumping
3. **Local Publishing** (Fallback): Traditional `npm publish` from your local machine

## Initial Setup Required (One-time)

### 1. Create NPM Access Token

1. **Log in to your npmjs.com account**
   - Go to [npmjs.com](https://www.npmjs.com) and sign in

2. **Navigate to Access Tokens**
   - Click on your profile picture (top right)
   - Go to "Account Settings"
   - Click "Access Tokens" in the left sidebar

3. **Generate New Token**
   - Click "Generate New Token"
   - Choose **"Automation"** type token
   - Set permissions to **"Read and write"**
   - Copy the generated token (starts with `npm_`)
   - ⚠️ **Important**: Save this token securely - you won't see it again!

### 2. Add GitHub Repository Secret

1. **Go to your GitHub repository**
   - Navigate to https://github.com/raymondlowe/mcp-client

2. **Access Repository Settings**
   - Click the "Settings" tab (not your account settings)
   - If you don't see this tab, you need admin permissions for the repository

3. **Add the Secret**
   - In the left sidebar, click "Secrets and variables" → "Actions"
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste the npm token from step 1
   - Click "Add secret"

## Publishing Options

### Option 1: Automatic Publishing on GitHub Release (Recommended)

This is the easiest way to publish once set up. The workflow runs automatically when you create a GitHub release.

#### Step-by-Step Process:

1. **Update package version** (if needed):
   ```bash
   # Choose one of these:
   npm version patch   # 1.0.7 → 1.0.8 (bug fixes)
   npm version minor   # 1.0.7 → 1.1.0 (new features)
   npm version major   # 1.0.7 → 2.0.0 (breaking changes)
   
   # Push the version update
   git push origin main --tags
   ```

2. **Create a GitHub Release**:
   - Go to your repository on GitHub
   - Click "Releases" (right side of the main page)
   - Click "Create a new release"
   - **Tag version**: Either select an existing tag (e.g., `v1.0.8`) or create a new one
   - **Release title**: Something like "Version 1.0.8" or "Bug fixes and improvements"
   - **Description**: Describe what changed in this version
   - Click "Publish release"

3. **Monitor the workflow**:
   - Go to the "Actions" tab in your GitHub repository
   - You'll see a workflow called "Publish to NPM" running
   - Click on it to see progress
   - **If you have npm 2FA enabled**: The workflow will pause and show instructions for entering your OTP

#### What the Workflow Does:
- ✅ Installs dependencies
- ✅ Runs linting (continues if it fails)
- ✅ Runs tests (stops if they fail)
- ✅ Builds the package
- ✅ Checks if the version is already published
- ✅ Publishes to npm (with 2FA support)

### Option 2: Manual Publishing with Version Bump

Use this when you want more control over the publishing process or need to publish without creating a GitHub release.

#### Step-by-Step Process:

1. **Go to GitHub Actions**:
   - Navigate to your repository
   - Click the "Actions" tab
   - Click on "Manual Publish to NPM" in the left sidebar

2. **Run the workflow**:
   - Click "Run workflow" (right side, green button)
   - Choose your version bump type:
     - **patch**: Bug fixes (1.0.7 → 1.0.8)
     - **minor**: New features (1.0.7 → 1.1.0)
     - **major**: Breaking changes (1.0.7 → 2.0.0)
     - **skip**: Use current version (if you manually updated package.json)
   - Click "Run workflow"

3. **Monitor the workflow**:
   - Click on the running workflow to see progress
   - The workflow will automatically update package.json, create a git tag, and publish

#### What This Workflow Does:
- ✅ All the same checks as automatic publishing
- ✅ Automatically bumps the version in package.json
- ✅ Creates a git commit and tag
- ✅ Pushes changes back to the main branch
- ✅ Publishes to npm

### Option 3: Local Manual Publishing (Fallback)

Use this if the GitHub workflows aren't working or you prefer publishing locally.

```bash
# Make sure you're on the main branch and up to date
git checkout main
git pull origin main

# Update version if needed
npm version patch  # or minor, major

# Build and test
npm run build
npm test

# Publish
npm publish
```

**Note**: Local publishing requires you to be logged in to npm (`npm login`) and have publish permissions.

## How 2FA/OTP Works with GitHub Actions

If you have npm 2FA enabled (recommended for security), here's what happens:

1. **Workflow Starts**: The publish workflow runs normally until it reaches the publish step
2. **OTP Required**: The `JS-DevTools/npm-publish` action detects 2FA is required
3. **Workflow Pauses**: The action pauses execution and waits for input
4. **OTP Input**: 
   - Check your authenticator app (Google Authenticator, Authy, etc.)
   - In the GitHub Actions log, you'll see instructions
   - Enter your 6-digit OTP when prompted
5. **Publishing Continues**: After successful OTP verification, publishing completes

**Tip**: Keep your authenticator app handy when publishing!

## Workflow Features

### Security Features
- ✅ Uses secure GitHub secrets for npm authentication
- ✅ Supports npm 2FA with interactive OTP input
- ✅ Token permissions are limited to publishing only
- ✅ No sensitive data exposed in logs

### Quality Assurance
- ✅ Runs full test suite before publishing
- ✅ Builds TypeScript to JavaScript
- ✅ Prevents duplicate version publishing
- ✅ Validates package contents before publishing
- ✅ Only publishes if all tests pass

### Automation Features
- ✅ Automatic triggering on GitHub release creation
- ✅ Manual workflow option with version bumping
- ✅ Automatic git tagging and pushing
- ✅ Comprehensive error handling and reporting

## Troubleshooting

### Publishing Fails with "Version already exists"
**Problem**: Trying to publish a version that already exists on npm.

**Solution**: 
- Update the version in package.json: `npm version patch`
- Or choose a different version bump in manual workflow
- Or use "skip" option if you've manually set a new version

### Publishing Fails with "Authentication failed"
**Problem**: NPM_TOKEN is invalid or missing.

**Solutions**:
1. **Check the secret exists**:
   - Go to repository Settings → Secrets and variables → Actions
   - Verify `NPM_TOKEN` is listed

2. **Regenerate the token**:
   - Go to npmjs.com → Account Settings → Access Tokens
   - Delete the old token and create a new one
   - Update the GitHub secret with the new token

3. **Check token permissions**:
   - Token should be "Automation" type with "Read and write" permissions
   - Your npm account should have publish permissions for `@raymondlowe/mcp-client`

### Workflow Fails at Test Step
**Problem**: Tests fail during the workflow.

**Solution**: 
- Fix the failing tests locally first
- Commit and push the fixes
- Try publishing again

### OTP/2FA Issues
**Problem**: Can't enter OTP or it's not accepted.

**Solutions**:
- Ensure you have access to your authenticator app
- Check the GitHub Actions log for specific OTP input instructions
- The workflow waits up to 10 minutes for OTP entry
- Make sure you're entering the current 6-digit code

### Manual Workflow Fails to Push Changes
**Problem**: "Push rejected" or permission errors.

**Solutions**:
- Ensure the repository allows GitHub Actions to write to the main branch
- Check if branch protection rules are blocking the push
- Verify the GITHUB_TOKEN has sufficient permissions

### Build Fails
**Problem**: TypeScript compilation or other build step fails.

**Solution**:
- Test the build locally: `npm run build`
- Fix any TypeScript errors
- Commit and push fixes

## Testing the Workflows

Before trying to publish, you can test your setup with this command:

```bash
npm run test:publish
```

This will run through all the steps that the GitHub workflows perform without actually publishing anything. It checks:

- ✅ Package.json is valid
- ✅ Required npm scripts exist
- ✅ Dependencies install correctly
- ✅ Build process works
- ✅ Tests pass
- ✅ Package contents are correct
- ✅ Version conflicts
- ✅ Workflow files exist

**Example output:**
```
🧪 Testing npm publishing setup...

✓ Checking package.json...
✓ Package: @raymondlowe/mcp-client@1.0.7
✓ Checking npm scripts...
✓ Found required script: build
✓ Found required script: test
✓ Found optional script: lint
✓ Testing npm install...
✓ npm ci successful
✓ Testing build...
✓ Build successful
✓ Testing test suite...
✓ Tests passed
✓ Testing package contents...
✓ Package contents look good
✓ Checking currently published version...
✓ Currently published version: 1.0.6
✓ Version 1.0.7 is ready to publish
✓ Checking GitHub workflow files...
✓ Found workflow: .github/workflows/publish.yml
✓ Found workflow: .github/workflows/manual-publish.yml
✓ Checking npm authentication...
⚠️  Not logged in to npm - this is fine for GitHub Actions publishing

📋 Test Summary:
✅ All checks passed!

🎉 Your setup looks good! You should be able to publish using GitHub Actions.

Next steps:
1. Make sure NPM_TOKEN is set in your GitHub repository secrets
2. Create a GitHub release to trigger automatic publishing
3. Or use the manual publish workflow in GitHub Actions
```

You can also manually test the individual build steps:

1. **Test the build process**:
   ```bash
   npm ci
   npm run build
   npm test
   npm pack --dry-run
   ```

2. **Test version checking**:
   ```bash
   # This should show the current published version
   npm view @raymondlowe/mcp-client version
   ```

3. **Test workflow syntax**:
   - GitHub validates workflow syntax automatically
   - Any syntax errors will show up in the Actions tab

## Security Notes

- ✅ The NPM_TOKEN is stored securely as a GitHub secret
- ✅ Workflows only run on release events or manual triggers (not on every commit)
- ✅ Token should have minimal required permissions (publish only)
- ✅ All operations are logged securely in GitHub Actions
- ✅ 2FA support provides additional security for publishing

## Getting Help

If you encounter issues:

1. **Check the GitHub Actions logs** for detailed error messages
2. **Verify all setup steps** were completed correctly
3. **Test locally** to isolate whether it's a workflow issue or code issue
4. **Check npm status** at [status.npmjs.org](https://status.npmjs.org)

## What's Next

After setup is complete, your publishing workflow will be:
1. Make code changes
2. Update version (if using automatic publishing)
3. Create GitHub release OR run manual workflow
4. Monitor the workflow and enter OTP if prompted
5. Package is automatically published to npm! 🎉