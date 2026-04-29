# Fallow Analysis Summary

**Analysis Date:** $(date)
**Project:** Official Ketab Yar
**Maintainability Score:** 85.5 (Good) ✅

## Overview

Fallow has analyzed your codebase and found:
- **520 dead code issues** (unused files, exports, dependencies)
- **188 duplicate code groups** (repeated logic)
- **386 complexity issues** (functions above threshold)

## Key Findings

### 🔴 High Priority Issues

#### 1. Dead Code (520 issues)
The analysis found significant unused code that can be safely removed:

**Top Files with Dead Code:**
- `lib/actions/book-tracking.ts` - 9 unused exports (100% dead)
- `lib/supabase/queries/vocabulary.ts` - 10 unused exports (100% dead)
- `lib/storage/unified-offline-operations.ts` - 25 unused exports (100% dead)
- `lib/utils/notification-queue.ts` - 6 unused exports (100% dead)
- `lib/offline/sync-manager.ts` - 5 unused exports (100% dead)

**Unused Directories:**
- `dont need/unused/` - Contains completely unused components
- `dont need/duplicates/` - Contains duplicate code

#### 2. Code Duplication (188 groups)
Repeated code blocks found across the codebase that could be refactored into shared utilities.

#### 3. Complexity Hotspots (386 functions)

**Highest Complexity Functions:**
- `components/vocabulary/word-suggestions.tsx:35` - fetchSuggestions (CRAP: 56.0)
- `components/vocabulary/flashcard-practice.tsx:64` - loadWords (CRAP: 56.0)
- `app/api/subscription/verify/route.ts:9` - GET (CRAP: 56.0)
- `components/leaderboard/leaderboard-tabs.tsx:47` - loadLeaderboard (CRAP: 56.0)
- `lib/gemini/api-key-manager.ts:106` - getWorkingKey (CRAP: 56.0)

### 📊 File Health Scores

**Lowest Health Scores (need attention):**
1. `components/sync/sync-indicator.tsx` - Score: 66.8 (222 LOC, 100% dead)
2. `components/admin/book-editor.tsx` - Score: 66.9 (593 LOC, 100% dead)
3. `components/vocabulary/vocabulary-manager.tsx` - Score: 67.1 (376 LOC, 100% dead)
4. `components/vocabulary/advanced-flashcard-system.tsx` - Score: 67.2 (435 LOC, 100% dead)

### 🔥 Hotspots (High Churn + High Complexity)

Files that are frequently changed AND complex (highest risk):

1. **components/reader/professional-reader.tsx** - 100.0 score
   - 5 commits, 3227 lines changed
   - 2 fan-in dependencies
   - Status: Cooling ▼

2. **app/books/read/[slug]/page.tsx** - 87.5 score
   - 5 commits, 634 lines changed
   - Status: Cooling ▼

3. **components/books/book-card.tsx** - 79.2 score
   - 5 commits, 363 lines changed
   - 7 fan-in dependencies
   - Status: Cooling ▼

### 🎯 Top Refactoring Targets

**Quick Wins (High ROI):**

1. **lib/sanity/transform.ts** - Score: 18.5, Priority: 36.9
   - High impact file (115 LOC)
   - 4 dependents amplify every change
   - Effort: Medium, Confidence: Medium

2. **lib/actions/book-tracking.ts** - Score: 16.0, Priority: 31.9
   - Remove 9 unused exports (100% dead)
   - Effort: Medium, Confidence: High

3. **lib/utils/notification-queue.ts** - Score: 15.9, Priority: 31.8
   - Remove 6 unused exports (100% dead)
   - Effort: Medium, Confidence: High

## Recommended Action Plan

### Phase 1: Quick Wins (1-2 days)
1. **Delete unused directories:**
   ```bash
   # Review and delete if confirmed unused
   rm -rf "dont need/unused"
   rm -rf "dont need/duplicates"
   ```

2. **Remove dead exports:**
   ```bash
   npm run fallow:fix:apply
   ```
   This will automatically remove unused exports.

3. **Run dead code analysis:**
   ```bash
   npm run fallow:dead
   ```
   Review and remove unused files.

### Phase 2: Reduce Duplication (2-3 days)
1. **Find duplicates:**
   ```bash
   npm run fallow:dupes
   ```

2. **Refactor common patterns:**
   - Extract repeated logic into shared utilities
   - Create reusable components
   - Consolidate similar functions

### Phase 3: Reduce Complexity (1 week)
1. **Focus on high-CRAP functions:**
   - Break down functions with CRAP > 50
   - Extract complex logic into smaller functions
   - Add unit tests to reduce CRAP score

2. **Target hotspot files:**
   - `components/reader/professional-reader.tsx`
   - `app/books/read/[slug]/page.tsx`
   - `components/books/book-card.tsx`

### Phase 4: Ongoing Maintenance
1. **Add Fallow to CI:**
   ```yaml
   # .github/workflows/code-quality.yml
   - name: Run Fallow Analysis
     run: npm run fallow:all
   ```

2. **Weekly reviews:**
   ```bash
   npm run fallow
   ```

3. **Pre-commit checks:**
   ```bash
   npm run fallow:health
   ```

## Metrics to Track

- **Maintainability Score:** Currently 85.5 (Good) - Target: 90+
- **Dead Code Issues:** Currently 520 - Target: < 50
- **Duplicate Groups:** Currently 188 - Target: < 50
- **High Complexity Functions:** Currently 386 - Target: < 100

## Understanding the Scores

### CRAP Score
- **< 30:** Good - Low complexity, well-tested
- **30-50:** Moderate - Needs attention
- **> 50:** High - Urgent refactoring needed

### File Health Score
- **> 80:** Excellent
- **70-80:** Good
- **60-70:** Needs improvement (your current range)
- **< 60:** Critical

### Cyclomatic Complexity
- **< 10:** Simple, easy to test
- **10-20:** Moderate complexity
- **> 20:** High complexity, hard to maintain

### Cognitive Complexity
- **< 15:** Easy to understand
- **15-30:** Moderate mental load
- **> 30:** Hard to understand

## Next Steps

1. **Review the unused code:**
   ```bash
   npm run fallow:dead
   ```

2. **Start with the easiest wins:**
   - Delete `dont need/` directories
   - Remove unused exports in `lib/` files

3. **Set up CI integration** to prevent future code debt

4. **Install VS Code extension** for real-time feedback

5. **Schedule weekly Fallow runs** to track progress

## Resources

- Full analysis: Run `npm run fallow:all`
- Dead code details: Run `npm run fallow:dead`
- Duplication details: Run `npm run fallow:dupes`
- Health details: Run `npm run fallow:health`
- Configuration: See `fallow.config.ts`
- Guide: See `FALLOW_GUIDE.md`

---

**Pro Tip:** Start with dead code removal - it's the safest and provides immediate benefits (smaller bundle size, faster builds, less confusion).
