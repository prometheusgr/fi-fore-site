#!/usr/bin/env node
/**
 * Generate unified latest.json from platform-specific YAML files
 * 
 * Usage in your fi-fore app's release workflow:
 *   node generate-manifest.js <version> <tag> <base-url>
 * 
 * Example:
 *   node generate-manifest.js 0.5.2 v0.5.3 https://github.com/prometheusgr/fi-fore-site/releases/download/v0.5.3
 * 
 * Or automatically from electron-builder's afterAllArtifactBuild hook
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Platform configurations
const PLATFORMS = [
  { yamlFile: 'latest.yml', pattern: /\.exe$/ },
  { yamlFile: 'latest-mac.yml', pattern: /\.dmg$/ },
  { yamlFile: 'latest-linux.yml', pattern: /\.AppImage$/ }
];

function parseYaml(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return yaml.load(content);
}

function generateManifest(releasesDir, baseUrl, tag) {
  const assets = [];
  let version = null;
  let publishedAt = new Date().toISOString();

  // Read each platform YAML
  PLATFORMS.forEach(({ yamlFile }) => {
    const yamlPath = path.join(releasesDir, yamlFile);
    const data = parseYaml(yamlPath);
    
    if (!data) {
      console.warn(`⚠️  ${yamlFile} not found, skipping`);
      return;
    }

    // Extract version (use first one found)
    if (!version) {
      version = data.version;
    }

    // Extract release date (use most recent)
    if (data.releaseDate) {
      const releaseDate = new Date(data.releaseDate);
      if (releaseDate > new Date(publishedAt)) {
        publishedAt = releaseDate.toISOString();
      }
    }

    // Extract file info
    if (data.path && data.size) {
      assets.push({
        name: data.path,
        size: data.size,
        url: `${baseUrl}/${encodeURIComponent(data.path)}`
      });
    } else if (data.files && data.files[0]) {
      const file = data.files[0];
      assets.push({
        name: file.url,
        size: file.size,
        url: `${baseUrl}/${encodeURIComponent(file.url)}`
      });
    }
  });

  if (assets.length === 0) {
    throw new Error('No assets found in YAML files');
  }

  // Generate manifest
  const manifest = {
    version: version || 'unknown',
    tag: tag,
    publishedAt: publishedAt,
    assets: assets
  };

  return manifest;
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Usage: node generate-manifest.js <version> <tag> <base-url>');
    console.error('Example: node generate-manifest.js 0.5.2 v0.5.3 https://github.com/USER/REPO/releases/download/v0.5.3');
    process.exit(1);
  }

  const [version, tag, baseUrl] = args;
  const releasesDir = __dirname;
  
  try {
    const manifest = generateManifest(releasesDir, baseUrl, tag);
    manifest.version = version; // Override with CLI arg for consistency
    
    const outputPath = path.join(releasesDir, 'latest.json');
    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2) + '\n');
    
    console.log('✅ Generated latest.json');
    console.log(`   Version: ${manifest.version}`);
    console.log(`   Assets: ${manifest.assets.length}`);
    manifest.assets.forEach(a => console.log(`     - ${a.name} (${(a.size / 1024 / 1024).toFixed(1)} MB)`));
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

module.exports = { generateManifest };
