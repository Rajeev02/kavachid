#!/bin/bash
if [ -f "VERSION" ]; then
  FILE_VERSION="v$(cat VERSION)"
else
  FILE_VERSION="v1.0.0"
fi
VERSION=${1:-$FILE_VERSION}
echo "🚀 Publishing Kavach Go SDK to Go Proxy..."
git tag sdks/kavach-go/$VERSION || echo "⚠️ Tag already exists, skipping tag creation..."
git push origin sdks/kavach-go/$VERSION || echo "⚠️ Tag already pushed, skipping push..."
echo "✅ Tag sdks/kavach-go/$VERSION pushed! Go Proxy will now index the module."
