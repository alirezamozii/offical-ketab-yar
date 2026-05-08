#!/bin/bash

echo "🚀 Starting TypeScript Error Fixes for keyab_yar"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check dependencies
echo "📦 Step 1: Checking dependencies..."
echo ""

MISSING_DEPS=()

if ! pnpm list next-sanity &> /dev/null; then
  MISSING_DEPS+=("next-sanity @sanity/client @sanity/image-url @sanity/vision sanity @portabletext/react")
fi

if ! pnpm list lucide-react &> /dev/null; then
  MISSING_DEPS+=("lucide-react")
fi

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Missing dependencies detected${NC}"
  echo "Run: pnpm add ${MISSING_DEPS[@]}"
  echo ""
  read -p "Install now? (y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    pnpm add ${MISSING_DEPS[@]}
  fi
else
  echo -e "${GREEN}✓ All dependencies installed${NC}"
fi

echo ""

# Step 2: Fix async params in route handlers
echo "🔧 Step 2: Fixing Next.js 15 async params..."
echo ""

if [ -f "fix-async-params.js" ]; then
  node fix-async-params.js
else
  echo -e "${RED}❌ fix-async-params.js not found${NC}"
fi

echo ""

# Step 3: Check Supabase types
echo "🗄️  Step 3: Checking Supabase types..."
echo ""

if [ -f "types/supabase.ts" ]; then
  LINES=$(wc -l < types/supabase.ts)
  if [ $LINES -lt 100 ]; then
    echo -e "${YELLOW}⚠️  Supabase types file seems incomplete ($LINES lines)${NC}"
    echo "You need to regenerate types:"
    echo "  npx supabase gen types typescript --project-id YOUR_PROJECT_REF > types/supabase.ts"
  else
    echo -e "${GREEN}✓ Supabase types file exists${NC}"
  fi
else
  echo -e "${RED}❌ types/supabase.ts not found${NC}"
  echo "Generate it with:"
  echo "  npx supabase gen types typescript --project-id YOUR_PROJECT_REF > types/supabase.ts"
fi

echo ""

# Step 4: Fix specific files
echo "📝 Step 4: Fixing specific component issues..."
echo ""

# Fix login form AuthCardHeader
if [ -f "components/auth/login-form.tsx" ]; then
  if grep -q "AuthCardHeader" "components/auth/login-form.tsx"; then
    echo "Fixing AuthCardHeader in login-form.tsx..."
    sed -i.backup 's/AuthCardHeader/CardHeader/g' "components/auth/login-form.tsx"
    echo -e "${GREEN}✓ Fixed login-form.tsx${NC}"
  fi
fi

# Fix Stripe API version
if [ -f "lib/stripe/stripe-client.ts" ]; then
  if grep -q "2024-12-18" "lib/stripe/stripe-client.ts"; then
    echo "Fixing Stripe API version..."
    sed -i.backup 's/2024-12-18.acacia/2025-10-29.clover/g' "lib/stripe/stripe-client.ts"
    echo -e "${GREEN}✓ Fixed Stripe API version${NC}"
  fi
fi

echo ""

# Step 5: Type check
echo "🔍 Step 5: Running type check..."
echo ""

echo "Counting errors before fixes..."
ERROR_COUNT=$(pnpm tsc --noEmit 2>&1 | grep -c "error TS" || true)
echo "Found $ERROR_COUNT TypeScript errors"

echo ""
echo "================================================"
echo "✅ Automated fixes complete!"
echo ""
echo "Next steps:"
echo "1. Review the changes (backup files created with .backup extension)"
echo "2. Regenerate Supabase types if needed"
echo "3. Run: pnpm tsc --noEmit"
echo "4. Run: pnpm build"
echo ""
echo "📖 See TYPESCRIPT_FIXES.md for detailed manual fixes"
