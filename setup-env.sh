#!/bin/bash

# Environment Setup Script for Hyun and Associates Website
echo "Setting up environment variables for Hyun and Associates website..."

# Create .env file with the required variables
cat > .env << EOF
# Cartesia TTS Configuration
VITE_CARTESIA_API_KEY=sk_car_uDYkY7f1JYTE5eB3AKqfEV
VITE_CARTESIA_VOICE_ID=5c5ad5e7-1020-476b-8b91-fdcbe9cc313c

# Voice API Configuration
VOICE_API_BASE_URL=https://d3sgivh2kmd3c8.cloudfront.net
VOICE_API_KEY=xpectrum-ai@123

# Frontend Voice API (Vite requires VITE_ prefix)
VITE_VOICE_API_KEY=xpectrum-ai@123

# Xpectrum Chatbot Configuration
XPECTRUM_API_BASE_URL=https://cloud.xpectrum.dev/v1
XPECTRUM_API_KEY=your-xpectrum-api-key
EOF

echo "✅ .env file created successfully!"
echo ""
echo "Environment variables configured:"
echo "- VITE_CARTESIA_API_KEY: sk_car_uDYkY7f1JYTE5eB3AKqfEV"
echo "- VITE_CARTESIA_VOICE_ID: 5c5ad5e7-1020-476b-8b91-fdcbe9cc313c"
echo "- VOICE_API_BASE_URL: https://d3sgivh2kmd3c8.cloudfront.net"
echo "- VOICE_API_KEY: xpectrum-ai@123"
echo "- VITE_VOICE_API_KEY: xpectrum-ai@123"
echo "- XPECTRUM_API_BASE_URL: https://cloud.xpectrum.dev/v1"
echo "- XPECTRUM_API_KEY: your-xpectrum-api-key"
echo ""
echo "🚀 You can now restart your servers to use the environment variables!"
echo ""
echo "To restart servers:"
echo "1. Stop existing: pkill -f 'node index.js' && pkill -f 'vite'"
echo "2. Start backend: cd backend && node index.js &"
echo "3. Start frontend: npm run dev -- --port 1000"
