#!/bin/bash
set -e

echo "Building React frontend..."
cd medibot-react
npm ci
npm run build
cd ..

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Build complete!"