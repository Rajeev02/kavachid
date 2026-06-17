#!/bin/bash
echo "🚀 Publishing Kavach Flutter SDK to Pub.dev..."
cd sdks/kavach-flutter
flutter pub publish || echo "⚠️ Version already published to Pub.dev or validation failed, skipping..."
