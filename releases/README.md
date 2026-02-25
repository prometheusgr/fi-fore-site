# Release Manifest Generator

This directory contains the release files for fi-fore downloads.

## Files

- `latest.json` - Unified manifest for the download page (all platforms)
- `latest.yml` - Windows auto-update manifest (electron-builder)
- `latest-mac.yml` - macOS auto-update manifest (electron-builder)
- `latest-linux.yml` - Linux auto-update manifest (electron-builder)
- `generate-manifest.js` - Script to generate latest.json from YAML files

## Automatic Updates

To automatically generate `latest.json` during your release process, add this to your **fi-fore app** repository:

### Option 1: Manual Script Execution

After electron-builder completes and generates the YAML files:

```bash
cd releases
node generate-manifest.js 0.5.2 v0.5.3 https://github.com/prometheusgr/fi-fore-site/releases/download/v0.5.3
```

### Option 2: Integrate with electron-builder

Add to your `package.json` or electron-builder config:

```javascript
// In your electron-builder config
{
  "afterAllArtifactBuild": "./scripts/after-build.js"
}
```

Create `scripts/after-build.js`:

```javascript
const { generateManifest } = require('../path/to/generate-manifest.js');
const fs = require('fs');
const path = require('path');

module.exports = async function(context) {
  const { electronPlatformName, appOutDir } = context;
  const version = context.packager.appInfo.version;
  const tag = `v${version}`;
  const baseUrl = `https://github.com/prometheusgr/fi-fore-site/releases/download/${tag}`;
  
  // Assume YAMLs are in dist/ or publish/
  const releasesDir = path.join(__dirname, '../dist');
  
  const manifest = generateManifest(releasesDir, baseUrl, tag);
  fs.writeFileSync(
    path.join(releasesDir, 'latest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log('✅ Generated latest.json');
};
```

### Option 3: GitHub Actions Workflow

If you're using GitHub Actions for releases:

```yaml
- name: Generate unified manifest
  run: |
    cd dist
    node ../releases/generate-manifest.js ${{ env.VERSION }} ${{ github.ref_name }} \
      https://github.com/${{ github.repository }}/releases/download/${{ github.ref_name }}
```

## Manual Updates

If you need to manually update `latest.json`:

1. Ensure all platform YAML files are up to date
2. Run the generator script with correct version and tag
3. Commit and push the updated `latest.json`

## Dependencies

The script requires `js-yaml` to parse YAML files:

```bash
npm install js-yaml
```

Or use it standalone (the script can be adapted to not require yaml parsing if needed).
