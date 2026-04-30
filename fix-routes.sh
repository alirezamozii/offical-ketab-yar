#!/bin/bash

# Script to fix Next.js 15 async params in route handlers

echo "Fixing Next.js 15 route handler params..."

# Find all route.ts files with dynamic params
find app/api -name "route.ts" -type f | while read file; do
  # Check if file contains dynamic route pattern
  if grep -q "{ params }: { params: { " "$file"; then
    echo "Processing: $file"
    
    # Backup original file
    cp "$file" "$file.backup"
    
    # Fix the params type to be Promise
    sed -i 's/{ params }: { params: { \([^}]*\) }/{ params }: { params: Promise<{ \1 }>/g' "$file"
    
    # Add await before params usage (simple pattern)
    sed -i 's/const { \([^}]*\) } = params;/const { \1 } = await params;/g' "$file"
    
    echo "Fixed: $file"
  fi
done

echo "Done! Backup files created with .backup extension"
echo "Please review changes and run: pnpm tsc --noEmit"
