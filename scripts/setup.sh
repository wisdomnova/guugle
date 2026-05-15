#!/bin/bash

# Web3 Intelligence Platform - Quick Setup Script

echo "🚀 Web3 Intelligence Platform Setup"
echo "======================================"
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing..."
    npm install -g pnpm
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo ""
    echo "⚠️  .env.local not found. Please create it with:"
    echo ""
    echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key"
    echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    echo "SEED_SECRET=your_seed_secret"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "✅ .env.local found"
echo ""

# Ask if user wants to seed database
read -p "Seed the database with sample data? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    if [ -z "$SEED_SECRET" ]; then
        echo "⚠️  SEED_SECRET not set in .env.local"
    else
        curl -X POST http://localhost:3000/api/admin/seed \
            -H "Authorization: Bearer $SEED_SECRET" \
            -H "Content-Type: application/json" 2>/dev/null || echo "❌ Could not seed (server not running)"
    fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'pnpm dev' to start the development server"
echo "2. Open http://localhost:3000 in your browser"
echo "3. Explore the intelligence dashboard"
echo ""
echo "For more information, see SETUP.md"
