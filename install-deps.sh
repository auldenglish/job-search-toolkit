#!/bin/bash
# Install dependencies required for .docx generation
# Run once after cloning: bash install-deps.sh

set -e

echo "=== Installing npm docx package ==="
npm install -g docx
echo "docx installed: $(npm list -g docx --depth=0 2>/dev/null | grep docx)"

echo ""
echo "=== Installing Python defusedxml ==="
pip3 install defusedxml 2>/dev/null || pip install defusedxml
echo "defusedxml installed"

echo ""
echo "=== Verifying Node.js ==="
node --version || echo "WARNING: node not found in PATH — you may need to use full path"

echo ""
echo "Done. Dependencies installed."
