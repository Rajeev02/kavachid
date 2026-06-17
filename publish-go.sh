#!/bin/bash
VERSION=${1:-"v1.0.0"}
echo "🚀 Publishing Kavach Go SDK to Go Proxy..."
git tag sdks/kavach-go/$VERSION
git push origin sdks/kavach-go/$VERSION
echo "✅ Tag sdks/kavach-go/$VERSION pushed! Go Proxy will now index the module."
