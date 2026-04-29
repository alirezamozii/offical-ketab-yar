# Fallow Setup Guide

Fallow is now configured for your Next.js TypeScript project! 🎉

## What is Fallow?

Fallow is a codebase intelligence tool that helps you:
- **Find unused code** (dead code, unused exports, unused dependencies)
- **Detect duplication** (repeated logic across your codebase)
- **Analyze complexity** (identify files that need refactoring)
- **Track architecture drift** (understand how your code is connected)

## Quick Start

### 1. Run All Analyses (Recommended First Step)

```bash
npm run fallow
```

This runs the main analysis and shows:
- Dead code overview
- Duplication summary
- Complexity hotspots

### 2. Individual Analyses

#### Find Dead Code
```bash
npm run fallow:dead
```
Shows:
- Unused files
- Unused exports
- Unused dependencies
- Feature flag branches that are never executed

#### Find Duplicated Code
```bash
npm run fallow:dupes
```
Shows:
- Repeated code blocks
- Similar logic across files
- Opportunities for refactoring

#### Check Code Health
```bash
npm run fallow:health
```
Shows:
- Cyclomatic complexity
- Cognitive complexity
- Large files that need splitting
- Complexity hotspots

### 3. Auto-Fix Issues (Dry Run)

```bash
npm run fallow:fix
```
Shows what would be fixed without making changes.

### 4. Apply Fixes

```bash
npm run fallow:fix:apply
```
⚠️ **Warning**: This will modify your code. Commit your changes first!

### 5. Run All Checks

```bash
npm run fallow:all
```
Runs all analyses in sequence.

## Configuration

The configuration is in `fallow.config.ts`. Key settings:

### Entry Points
- All app routes (`app/**/*.{ts,tsx}`)
- All components (`components/**/*.{ts,tsx}`)
- Utilities, hooks, and types
- Next.js config files

### Ignored Paths
- `node_modules`
- `.next` build directory
- Sanity Studio
- Test files

### Next.js Integration
- Automatically recognizes Next.js special files (page.tsx, layout.tsx, etc.)
- Understands App Router structure
- Recognizes API routes

### Thresholds
- **Duplication**: Minimum 5 lines or 50 tokens
- **Cyclomatic Complexity**: Warning at 10
- **Cognitive Complexity**: Warning at 15
- **File Size**: Warning at 500 lines

## Common Use Cases

### Before Refactoring
```bash
npm run fallow:health
```
Identify the most complex files that need attention.

### Before Deployment
```bash
npm run fallow:dead
```
Remove unused code to reduce bundle size.

### Code Review
```bash
npm run fallow:dupes
```
Find opportunities to DRY up your code.

### Dependency Cleanup
```bash
npm run fallow:dead
```
Find unused npm packages to remove.

## CI Integration

Add to your CI pipeline (e.g., GitHub Actions):

```yaml
- name: Run Fallow Analysis
  run: npm run fallow:all
```

## VS Code Extension (Optional)

Install the Fallow VS Code extension for:
- Real-time diagnostics in the editor
- Code Lens showing usage information
- One-click fixes
- Inline complexity metrics

Search for "Fallow" in VS Code extensions.

## MCP Integration (For AI Agents)

Fallow supports Model Context Protocol for use with:
- Claude Code
- Cursor
- Other AI coding assistants

The agent can call Fallow tools directly for structured analysis.

## Tips

1. **Start Small**: Run `npm run fallow` first to get an overview
2. **Review Before Fixing**: Always use `--dry-run` before applying fixes
3. **Commit First**: Make sure your code is committed before running fixes
4. **Regular Checks**: Run Fallow weekly to prevent code debt accumulation
5. **Focus on Health**: Use health analysis to prioritize refactoring work

## Understanding the Output

### Dead Code
- **Unused files**: Files that are never imported
- **Unused exports**: Functions/components exported but never used
- **Unused dependencies**: npm packages in package.json but never imported

### Duplication
- **Exact duplicates**: Identical code blocks
- **Similar code**: Code with minor variations
- **Structural similarity**: Same logic, different names

### Health/Complexity
- **Cyclomatic complexity**: Number of decision paths (if/else, loops, etc.)
- **Cognitive complexity**: How hard the code is to understand
- **File size**: Lines of code per file

## Next Steps

1. Run your first analysis:
   ```bash
   npm run fallow
   ```

2. Review the results and identify quick wins

3. Start with dead code removal (safest):
   ```bash
   npm run fallow:dead
   ```

4. Set up CI integration to prevent code debt

5. Consider installing the VS Code extension for real-time feedback

## Resources

- [Official Documentation](https://docs.fallow.tools)
- [CLI Reference](https://docs.fallow.tools/cli)
- [Configuration Guide](https://docs.fallow.tools/configuration)
- [GitHub Repository](https://github.com/fallow-tools/fallow)

## Troubleshooting

### "No files found"
- Check your `entry` patterns in `fallow.config.ts`
- Ensure TypeScript files are not in ignored paths

### "Too many false positives"
- Adjust `deadCode.exclude` patterns
- Add specific files to ignore list

### "Performance issues"
- Add more specific ignore patterns
- Reduce the scope of entry points
- Use `--max-workers` flag to limit CPU usage

## Support

- GitHub Issues: Report bugs or request features
- Discussions: Ask questions and share tips
- Documentation: Comprehensive guides and examples

---

Happy code cleaning! 🧹✨
