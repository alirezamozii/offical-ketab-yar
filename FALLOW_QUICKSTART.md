# Fallow Quick Start Checklist

Get started with Fallow in 5 minutes! ⚡

## ✅ Setup Complete

- [x] Fallow installed (`npm install --save-dev fallow`)
- [x] Configuration file created (`fallow.config.ts`)
- [x] NPM scripts added to `package.json`
- [x] Initial analysis completed
- [x] CI workflow created (`.github/workflows/code-quality.yml`)

## 🚀 Next Steps

### 1. Review Your First Analysis (2 minutes)

```bash
npm run fallow
```

**What you'll see:**
- Dead code overview
- Duplication summary
- Complexity hotspots
- File health scores
- Refactoring targets

### 2. Explore Dead Code (5 minutes)

```bash
npm run fallow:dead
```

**Look for:**
- Unused files in `dont need/` directories
- Unused exports in `lib/` files
- Unused npm dependencies

**Quick win:** Delete the `dont need/` directories if confirmed unused.

### 3. Check Duplicates (5 minutes)

```bash
npm run fallow:dupes
```

**Look for:**
- Repeated code blocks
- Similar functions across files
- Opportunities to create shared utilities

### 4. Review Complexity (5 minutes)

```bash
npm run fallow:health
```

**Focus on:**
- Functions with CRAP > 50
- Files with health score < 70
- Hotspot files (high churn + high complexity)

### 5. Preview Auto-Fixes (2 minutes)

```bash
npm run fallow:fix
```

**This shows what would be fixed without making changes.**

Safe to run anytime!

## 📋 Your First Cleanup Task

Based on the analysis, here's your first task:

### Task: Remove Dead Code in `lib/` Files

**Estimated time:** 30 minutes

1. **Review unused exports:**
   ```bash
   npm run fallow:dead | grep "lib/"
   ```

2. **Top targets:**
   - `lib/actions/book-tracking.ts` (9 unused exports)
   - `lib/supabase/queries/vocabulary.ts` (10 unused exports)
   - `lib/storage/unified-offline-operations.ts` (25 unused exports)

3. **Apply fixes:**
   ```bash
   # Commit your current work first!
   git add .
   git commit -m "Before Fallow cleanup"
   
   # Apply fixes
   npm run fallow:fix:apply
   
   # Review changes
   git diff
   
   # Test your app
   npm run build
   npm run type-check
   ```

4. **Expected benefits:**
   - Smaller bundle size
   - Faster builds
   - Less confusion for developers
   - Reduced maintenance burden

## 🎯 Weekly Routine (5 minutes)

Add this to your weekly workflow:

```bash
# Monday morning code quality check
npm run fallow

# Review the output
# - Any new dead code?
# - New complexity hotspots?
# - Increasing duplication?

# Take action on top 3 issues
```

## 🔧 VS Code Integration (Optional)

1. Open VS Code Extensions
2. Search for "Fallow"
3. Install the extension
4. Restart VS Code

**You'll get:**
- Real-time dead code warnings
- Complexity metrics in Code Lens
- One-click fixes
- Usage information on hover

## 📊 Track Your Progress

Create a simple tracking document:

```markdown
# Code Quality Progress

## Week 1 (Current)
- Maintainability: 85.5
- Dead Code: 520 issues
- Duplicates: 188 groups
- Complexity: 386 functions

## Week 2 (Target)
- Maintainability: 87.0
- Dead Code: < 400 issues
- Duplicates: < 150 groups
- Complexity: < 300 functions
```

## 🚨 Common Issues

### "No files found"
**Solution:** Check `entry` patterns in `fallow.config.ts`

### "Too many false positives"
**Solution:** Add patterns to `deadCode.exclude` in config

### "Analysis is slow"
**Solution:** Add more specific `ignore` patterns

### "Can't find TypeScript files"
**Solution:** Verify `tsconfig` path in config

## 📚 Learn More

- **Full Guide:** See `FALLOW_GUIDE.md`
- **Analysis Summary:** See `FALLOW_ANALYSIS_SUMMARY.md`
- **Command Reference:** See `.kiro/steering/fallow-commands.md`
- **Official Docs:** https://docs.fallow.tools

## 💡 Pro Tips

1. **Start small:** Focus on one file or directory at a time
2. **Commit often:** Make it easy to rollback if needed
3. **Test after cleanup:** Run `npm run build` and `npm run type-check`
4. **Review with team:** Discuss findings in code review
5. **Automate:** Add Fallow to your CI pipeline

## 🎉 Success Metrics

You'll know Fallow is working when:

- ✅ Bundle size decreases
- ✅ Build time improves
- ✅ Fewer merge conflicts
- ✅ Easier to find code
- ✅ New developers onboard faster
- ✅ Less "what does this do?" questions

## 🤝 Need Help?

- **Documentation:** https://docs.fallow.tools
- **GitHub Issues:** https://github.com/fallow-tools/fallow/issues
- **Discussions:** https://github.com/fallow-tools/fallow/discussions

---

**Ready to start?** Run `npm run fallow` and begin your code quality journey! 🚀
