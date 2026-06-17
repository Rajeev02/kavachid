const fs = require('fs');
const path = require('path');

// 1. Read Current Version
const versionFile = path.join(__dirname, 'VERSION');
let currentVersion = fs.readFileSync(versionFile, 'utf8').trim();

// 2. Increment Patch Version
const parts = currentVersion.split('.');
const newVersion = `${parts[0]}.${parts[1]}.${parseInt(parts[2], 10) + 1}`;

console.log(`🚀 Bumping monorepo version from ${currentVersion} to ${newVersion}...`);

// 3. Helper Functions
function bumpJson(file) {
  const p = path.join(__dirname, file);
  if (fs.existsSync(p)) {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    data.version = newVersion;
    fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
    console.log(`✅ Updated ${file}`);
  }
}

function bumpRegex(file, regex, replacement) {
  const p = path.join(__dirname, file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(regex, replacement);
    fs.writeFileSync(p, content);
    console.log(`✅ Updated ${file}`);
  }
}

// 4. Perform Bumps
// Web & React Native
bumpJson('sdks/kavach-web/package.json');
bumpJson('sdks/kavach-react-native/package.json');

// Python
bumpRegex('sdks/kavach-python/setup.py', /version="[0-9\.]+"/, `version="${newVersion}"`);

// Flutter
bumpRegex('sdks/kavach-flutter/pubspec.yaml', /version: [0-9\.]+/, `version: ${newVersion}`);

// iOS (CocoaPods)
bumpRegex('sdks/kavach-ios/KavachSDK.podspec', /spec\.version\s+=\s+"[0-9\.]+"/, `spec.version      = "${newVersion}"`);

// Android (Maven)
bumpRegex('sdks/kavach-android/build.gradle.kts', /version\s+=\s+"[0-9\.]+"/, `version = "${newVersion}"`);

// 5. Save New Version File
fs.writeFileSync(versionFile, newVersion + '\n');
console.log(`🎉 Monorepo is now at v${newVersion}! You can now run your publish scripts.`);
