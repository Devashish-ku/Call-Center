#!/bin/bash

# Setup script for Call Center Management System

echo "Setting up Call Center Management System..."

# Create uploads directory if it doesn't exist
if [ ! -d "uploads" ]; then
    mkdir uploads
    echo "✓ Created uploads directory"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✓ Created .env file from template"
        echo "⚠️  Please update .env with your actual credentials"
    else
        echo "❌ .env.example not found"
    fi
else
    echo "✓ .env file already exists"
fi

echo "Setup complete! Don't forget to:"
echo "1. Update .env with your actual database credentials"
echo "2. Run 'npm install' to install dependencies"
echo "3. Run 'npm run dev' to start the development server"