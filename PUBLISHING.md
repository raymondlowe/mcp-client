# NPM Publishing Setup Instructions

This repository is configured for semi-automated publishing to npmjs.com when GitHub releases are created.

## Initial Setup Required (One-time)

### 1. Create NPM Access Token

1. Log in to your npmjs.com account
2. Go to Account Settings → Access Tokens
3. Click "Generate New Token"
4. Choose **"Automation"** type token with **"Read and write"** permissions
5. Copy the generated token (it starts with `npm_`)

### 2. Add GitHub Repository Secret

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions  
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Paste the npm token from step 1
6. Click "Add secret"

## Publishing Options

### Option 1: Automatic Publishing on GitHub Release (Recommended)

1. **Update package version** (if not already done):
   ```bash
   npm version patch  # or minor, major
   git push origin main --tags
   ```

2. **Create a GitHub Release**:
   - Go to GitHub repository → Releases
   - Click "Create a new release"
   - Choose existing tag or create new one (e.g., `v1.0.8`)
   - Add release title and description
   - Click "Publish release"

3. **Monitor the workflow**:
   - Go to Actions tab in GitHub
   - Watch the "Publish to NPM" workflow run
   - If you have 2FA enabled on npm, the workflow will pause and provide instructions for OTP entry

### Option 2: Manual Publishing with Version Bump

1. Go to your GitHub repository
2. Navigate to Actions tab
3. Click on "Manual Publish to NPM" workflow
4. Click "Run workflow"
5. Choose version bump type (patch, minor, major, or skip)
6. Click "Run workflow"
7. Monitor the workflow run for OTP prompts if needed

### Option 3: Local Manual Publishing (Fallback)

```bash
npm run build
npm publish
```

## Workflow Features

- ✅ Triggers automatically on GitHub release creation
- ✅ Runs full test suite before publishing
- ✅ Builds TypeScript to JavaScript
- ✅ Supports npm 2FA with interactive OTP input via JS-DevTools/npm-publish action
- ✅ Uses secure GitHub secrets for npm authentication
- ✅ Only publishes if tests pass
- ✅ Prevents duplicate version publishing
- ✅ Manual workflow option with version bumping

## How 2FA/OTP Works

If you have npm 2FA enabled, the workflow uses the `JS-DevTools/npm-publish` action which:
- Detects when OTP is required
- Pauses the workflow execution
- Displays instructions in the GitHub Actions log
- Waits for you to enter the OTP in the workflow interface
- Continues publishing after OTP verification

## Troubleshooting

### If publishing fails:
1. **Check NPM_TOKEN**: Verify the secret is set correctly in repository settings
2. **Check permissions**: Ensure your npm account has publish permissions for `@raymondlowe/mcp-client`
3. **Check version**: Ensure package.json version is higher than the current published version
4. **Check logs**: Review the GitHub Actions logs for specific error messages

### Version conflicts:
- The workflow checks if the version is already published before attempting to publish
- If version exists, bump the version in package.json before creating a release

### OTP Issues:
- Ensure you have access to your npm 2FA device/app
- The workflow will wait up to 10 minutes for OTP entry
- Check the GitHub Actions UI for OTP input prompts

## Security Notes

- The NPM_TOKEN is stored securely as a GitHub secret
- The workflow only runs on release events or manual triggers, not on every commit
- The token should have minimal required permissions for publishing only
- All sensitive operations are logged securely in GitHub Actions