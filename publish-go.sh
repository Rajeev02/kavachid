#!/bin/bash
VERSION=${1:-"v1.0.0"}
echo "🚀 Publishing Kavach Go SDK to Go Proxy..."
git tag sdks/kavach-go/
git push origin sdks/kavach-go/
echo "✅ Tag sdks/kavach-go/ pushed! Go Proxy will now index the module."
