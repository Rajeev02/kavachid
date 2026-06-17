#!/bin/bash
set -e

echo "🚀 Starting KavachID Library NPM Publishing..."

# Build and Publish @kavachid/sdk
echo "-----------------------------------"
echo "📦 Building & Publishing @kavachid/sdk..."
cd kavach-sdk
npm run build
npm publish --access public

# Build and Publish @kavachid/react
echo "-----------------------------------"
echo "📦 Building & Publishing @kavachid/react..."
cd ../kavach-react
npm run build
npm publish --access public

# Build and Publish @kavachid/react-native
echo "-----------------------------------"
echo "📦 Building & Publishing @kavachid/react-native..."
cd ../kavach-react-native
npm run build
npm publish --access public

# Build and Publish @kavachid/express
echo "-----------------------------------"
echo "📦 Building & Publishing @kavachid/express..."
cd ../kavach-express
npm run build
npm publish --access public

echo "-----------------------------------"
echo "✅ All packages built and published successfully!"
