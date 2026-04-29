---
title: Fallow Code Intelligence Commands
inclusion: manual
---

# Fallow Quick Reference

## Common Commands

### Analysis Commands
```bash
# Run all analyses (recommended first step)
npm run fallow

# Find dead code (unused files, exports, dependencies)
npm run fallow:dead

# Find duplicate code
npm run fallow:dupes

# Check code health and complexity
npm run fallow:health

# Run all checks in sequence
npm run fallow:all
```

### Fix Commands
```bash
# Preview fixes without applying (safe)
npm run fallow:fix

# Apply automatic fixes (⚠️ commit first!)
npm run fallow:fix:apply
```

## Direct Fallow CLI

```bash
# Run with custom options
npx fallow --help

# Analyze specific files
npx fallow dead-code --include "components/**"

# Export results as JSON
npx fallow --format json > analysis.json

# Ignore specific patterns
npx fallow --ignore "**/*.test.ts"

# Set custom thresholds
npx fallow health --cyclomatic 15 --cognitive 20
```

## Understanding Output

### Dead Code
- **Unused files:** Files never imported anywhere
- **Unused exports:** Functions/components exported but never used
- **Unused dependencies:** npm packages in package.json but never imported

### CRAP Score
- **< 30:** Good
- **30-50:** Moderate - needs attention
- **> 50:** High - urgent refactoring needed

### File Health Score
- **> 80:** Excellent
- **70-80:** Good
- **60-70:** Needs improvement
- **< 60:** Critical

### Hotspot Status
- **▲ Accelerating:** Increasing churn + complexity (high risk)
- **─ Stable:** Consistent churn
- **▼ Cooling:** Decreasing churn (lower risk)

## Configuration

Edit `fallow.config.ts` to customize:
- Entry points
- Ignore patterns
- Complexity thresholds
- Duplication sensitivity

## CI Integration

Add to `.github/workflows/code-quality.yml`:
```yaml
- name: Code Quality Check
  run: npm run fallow:all
```

## VS Code Extension

Search for "Fallow" in VS Code extensions for:
- Real-time diagnostics
- Code Lens usage info
- One-click fixes
- Inline complexity metrics

## Tips

1. **Start with dead code** - safest and immediate benefits
2. **Review before fixing** - always use `--dry-run` first
3. **Commit before applying fixes** - easy rollback if needed
4. **Run weekly** - prevent code debt accumulation
5. **Focus on hotspots** - high churn + high complexity = highest risk

## Current Project Status

- **Maintainability:** 85.5 (Good)
- **Dead Code Issues:** 520
- **Duplicate Groups:** 188
- **Complexity Issues:** 386

See `FALLOW_ANALYSIS_SUMMARY.md` for detailed findings.
