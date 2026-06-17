#!/bin/bash
echo "🚀 Building and Publishing Kavach Python SDK to PyPI..."
cd sdks/kavach-python

echo "📦 Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

echo "📦 Installing build tools..."
pip install --upgrade pip build twine

echo "📦 Building wheel..."
python3 -m build

echo "📦 Uploading to PyPI..."
python3 -m twine upload dist/*

echo "🧹 Cleaning up..."
deactivate
rm -rf venv
