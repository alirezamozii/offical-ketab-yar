# TypeScript Error Fixes for keyab_yar Project

## Summary of Issues

1. **Next.js 15 Breaking Change**: Route handler `params` are now async (Promise)
2. **Missing Supabase Type Definitions**: Tables return `never` type
3. **Missing Dependencies**: Sanity, icons, and other packages
4. **Type Mismatches**: Various component prop and type issues

## Priority Fixes

### 1. Install Missing Dependencies

```bash
pnpm add next-sanity @sanity/client @sanity/image-url @sanity/vision sanity @portabletext/react
pnpm add lucide-react  # For Loader2 icon
```

### 2. Fix Supabase Database Types

The main issue is that Supabase tables are returning `never` type. This needs regeneration:

```bash
# Generate types from your Supabase database
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
```

Or manually update `types/supabase.ts` to include proper table definitions.

### 3. Fix Next.js 15 Route Handlers (Async Params)

All dynamic route handlers need to await params. Example pattern:

**Before:**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
}
```

**After:**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
}
```

### 4. Fix Missing Loader2 Import

```typescript
// Add to files using Loader2
import { Loader2 } from 'lucide-react';
```

### 5. Fix AuthCardHeader Import

```typescript
// In components/auth/login-form.tsx
import { CardHeader } from '@/components/ui/card';
// Replace AuthCardHeader with CardHeader
```

## Automated Fix Script

Run this script to fix the most common issues:

```bash
# Create and run the fix script
chmod +x fix-routes.sh
./fix-routes.sh
```

## Manual Fixes Required

1. **Sanity Configuration**: Set up sanity.config.ts properly
2. **Database Schema**: Ensure Supabase types are generated
3. **Environment Variables**: Check all required env vars are set
4. **MCP Configuration**: Review mcp.json if using Model Context Protocol

## Testing After Fixes

```bash
# Type check
pnpm tsc --noEmit

# Build check
pnpm build

# Run dev server
pnpm dev
```
