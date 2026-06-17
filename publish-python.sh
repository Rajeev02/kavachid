#!/bin/bash
echo "🚀 Building and Publishing Kavach Python SDK to PyPI..."
cd sdks/kavach-python
python3 -m pip install --upgrade build twine
python3 -m build
python3 -m twine upload dist/*
