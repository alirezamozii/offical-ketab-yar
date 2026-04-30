# Complete TypeScript Error Fixes

## Critical Issues Summary

Your project has **~500+ TypeScript errors** primarily caused by:

1. **Next.js 15 Breaking Change** - Route params are now async
2. **Missing Supabase Type Definitions** - All tables return `never`
3. **Missing Admin Routes** - Referenced but don't exist
4. **Missing Dependencies** - Sanity, icons, etc.

## Step-by-Step Fix Guide

### Step 1: Install Missing Dependencies

```bash
# Install Sanity and related packages
pnpm add next-sanity @sanity/client @sanity/image-url @sanity/vision sanity @portabletext/react

# Install missing UI icons
pnpm add lucide-react

# Install fallow if needed
pnpm add fallow
```

### Step 2: Regenerate Supabase Types

This is **THE MOST CRITICAL FIX** - it will resolve 300+ errors.

```bash
# Option A: Using Supabase CLI (recommended)
npx supabase login
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > types/supabase.ts

# Option B: Manual from Supabase Dashboard
# Go to: Project Settings > API > Generate Types
# Copy and paste into types/supabase.ts
```

### Step 3: Fix Next.js 15 Route Handlers

Create this script as `fix-async-params.js`:

```javascript
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all route.ts files
const files = glob.sync('app/api/**/route.ts');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Pattern 1: Fix params type
  if (content.includes('{ params }: { params: {')) {
    content = content.replace(
      /\{ params \}: \{ params: \{([^}]+)\} \}/g,
      '{ params }: { params: Promise<{$1}> }'
    );
    modified = true;
  }

  // Pattern 2: Add await to params destructuring
  if (content.includes('const { ') && content.includes(' } = params')) {
    content = content.replace(
      /const \{ ([^}]+) \} = params;/g,
      'const { $1 } = await params;'
    );
    modified = true;
  }

  // Pattern 3: Fix direct params.id usage
  content = content.replace(
    /params\.(\w+)/g,
    '(await params).$1'
  );

  if (modified) {
    fs.writeFileSync(file, content);
    console.log(`Fixed: ${file}`);
  }
});

console.log('Done!');
```

Run it:
```bash
node fix-async-params.js
```

### Step 4: Fix Specific Component Issues

#### A. Fix Login Form (AuthCardHeader)

```typescript
// components/auth/login-form.tsx
// Change line 61 from:
<AuthCardHeader>
// To:
<CardHeader>
```

#### B. Add Loader2 Import Where Missing

Files that need it (based on errors):
- `app/admin/authors/edit/[id]/page.tsx` (if exists)
- `app/admin/books/edit/[id]/page.tsx` (if exists)
- `app/admin/genres/edit/[id]/page.tsx` (if exists)

Add this import:
```typescript
import { Loader2 } from 'lucide-react';
```

#### C. Fix Sanity Studio Page

```typescript
// app/Studio/[[...tool]]/page.tsx
// Make sure you have sanity installed first, then:
import { NextStudio } from 'next-sanity/studio';
import config from '@/sanity.config';

export default function StudioPage() {
  return <NextStudio config={config} />;
}
```

### Step 5: Fix Database Query Type Issues

After regenerating Supabase types, you may need to update query patterns:

```typescript
// OLD (causes never type):
const { data } = await supabase
  .from('users')
  .select('*')
  .single();

// NEW (with proper typing):
const { data } = await supabase
  .from('users')
  .select('*')
  .single<Database['public']['Tables']['users']['Row']>();
```

### Step 6: Fix Stripe API Version

```typescript
// lib/stripe/stripe-client.ts
// Change line 5:
apiVersion: '2025-10-29.clover' as const,
```

### Step 7: Create Missing Admin Routes (Optional)

If you need the admin routes, create them:

```bash
mkdir -p app/api/admin/{authors,books,genres,users}/{update,list}
mkdir -p app/api/admin/draft-access/{grant,revoke,list}
mkdir -p app/api/admin/{api-keys,settings,sync-books,upload-image,dashboard}
```

Then create basic route handlers following Next.js 15 patterns.

## Quick Verification

After fixes, run:

```bash
# Type check
pnpm tsc --noEmit

# Count remaining errors
pnpm tsc --noEmit 2>&1 | grep "error TS" | wc -l

# Build test
pnpm build
```

## Expected Results

- **Before**: ~500 errors
- **After Step 2 (Supabase types)**: ~150 errors
- **After Step 3 (Route handlers)**: ~50 errors
- **After Steps 4-7**: <10 errors

## Common Remaining Issues

1. **Unused variables** - ESLint warnings, not TypeScript errors
2. **Missing exports** - Some components marked as "not exported"
3. **Type mismatches** - Minor fixes needed per component

## Need Help?

If errors persist after these steps:

1. Share the output of: `pnpm tsc --noEmit > errors.txt`
2. Check Supabase types were generated correctly
3. Verify all dependencies installed: `pnpm install`
4. Clear Next.js cache: `rm -rf .next`

## Pro Tips

- Fix Supabase types FIRST - it's 60% of your errors
- Use `// @ts-expect-error` sparingly for quick fixes
- Consider using `skipLibCheck: true` in tsconfig.json temporarily
- Run `pnpm tsc --noEmit --watch` to see fixes in real-time
