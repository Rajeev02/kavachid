#!/bin/bash
set -e

echo "🚀 Starting Kavach Ecosystem NPM Publishing..."

# Build and Publish @kavach/sdk
echo "-----------------------------------"
echo "📦 Building & Publishing @kavach/sdk (Includes Kavach Shield Engine bindings)..."
cd kavach-sdk
npm run build
npm publish --access public
cd ..

echo "-----------------------------------"
echo "✅ Kavach SDK published successfully!"
echo "Note: The samples in the 'samples/' directory are not published to NPM."
