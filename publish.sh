#!/bin/bash
set -e

echo "🚀 Starting Kavach Ecosystem NPM Publishing..."

# Build and Publish @rajeev02/kavach-web
echo "-----------------------------------"
echo "📦 Building & Publishing @rajeev02/kavach-web..."
cd sdks/kavach-web
npm run build
npm publish --access public
cd ../..

# Build and Publish @rajeev02/kavach-react-native
echo "-----------------------------------"
echo "📦 Building & Publishing @rajeev02/kavach-react-native..."
cd sdks/kavach-react-native
npm publish --access public
cd ../..

echo "-----------------------------------"
echo "✅ Kavach NPM Packages (Web & React Native) published successfully!"
echo "Note: iOS, Android, Flutter, Python, and Go SDKs must be published to their respective native registries (Cocoapods, Maven, Pub.dev, PyPI)."
