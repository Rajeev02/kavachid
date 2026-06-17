#!/bin/bash
set -e

echo "🚀 Starting Kavach Ecosystem NPM Publishing..."

# Build and Publish @rajeev02/kavach-web
echo "-----------------------------------"
echo "📦 Building & Publishing @rajeev02/kavach-web (Includes Kavach Shield Engine bindings)..."
cd sdks/kavach-web
npm run build
npm publish --access public
cd ..

echo "-----------------------------------"
echo "✅ Kavach SDK published successfully!"
echo "Note: The samples in the 'samples/' directory are not published to NPM."
