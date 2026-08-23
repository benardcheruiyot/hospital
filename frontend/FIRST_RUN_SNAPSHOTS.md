# Playwright Tests - First Run in CI Guide

## Situation

You have 15 failing tests in GitHub Actions because:
1. **Snapshots don't exist** - First time running these tests in CI
2. **Tests expect snapshots to compare against** - But they haven't been generated yet
3. **Accessibility tests failing** - Module/import issues (FIXED in updated code)
4. **Visual tests timing out** - Too aggressive timeouts (FIXED in updated config)

## Solution: Three-Step Process

### Step 1: Generate Snapshots Locally ✅

Run tests locally to generate snapshot files:

```bash
cd frontend

# Install dependencies (if not already done)
npm install

# Run tests to generate snapshots
npm run test:playwright

# This will create/update snapshots in:
# tests/playwright/__snapshots__/
```

**What to expect:**
- Tests will fail initially (no snapshots to compare)
- Files written to test-results/ folder
- Actual screenshots saved in `tests/playwright/__snapshots__/` with `-chromium-linux` suffix

### Step 2: Review & Commit Snapshots ✅

Review the generated snapshots to ensure they look correct:

```bash
# See what was created
git status
ls tests/playwright/__snapshots__/

# Review visual snapshots (if you want)
npx playwright show-report

# Add and commit snapshots
git add tests/playwright/__snapshots__
git commit -m "chore: add initial Playwright snapshots"
```

### Step 3: Push & Verify in CI ✅

```bash
git push
```

Go to **GitHub Actions** and verify:
- ✅ All tests pass
- ✅ No more "snapshot doesn't exist" errors
- ✅ Accessibility tests pass
- ✅ Visual tests complete within timeouts

---

## Alternative: Generate Snapshots in CI (Not Recommended)

If you can't run locally, you can generate in CI but it's trickier:

1. Create a branch for snapshot generation
2. Update the CI workflow temporarily:

```yaml
- name: Generate Playwright snapshots
  working-directory: frontend
  run: npm run test:playwright -- --update-snapshots
```

3. Let it run and generate snapshots
4. Commit the snapshots: `git add tests/playwright/__snapshots__`
5. Revert the CI workflow change
6. Push and verify tests pass normally

---

## File Structure After Setup

```
frontend/
├── tests/playwright/
│   ├── __snapshots__/                    # ← Generated snapshots go here
│   │   ├── accessibility.spec.ts-snapshots/
│   │   ├── visual.spec.ts-snapshots/
│   │   └── multi-visual.spec.ts-snapshots/
│   ├── accessibility.spec.ts             # ← FIXED
│   ├── visual.spec.ts                    # ← FIXED
│   └── multi-visual.spec.ts              # ← FIXED
├── playwright.config.ts                  # ← FIXED
└── test-results/                         # ← Temporary test output (gitignored)
```

---

## Expected Snapshots

After generation, you'll have snapshots like:

```
tests/playwright/__snapshots__/
├── accessibility.spec.ts-snapshots/
│   └── (no snapshots - axe runs in browser)
├── visual.spec.ts-snapshots/
│   ├── landing-hero-chromium-linux.png
│   └── landing-hero-full-chromium-linux.png
├── multi-visual.spec.ts-snapshots/
│   ├── landing-full-chromium-linux.png
│   ├── patient-portal-full-chromium-linux.png
│   ├── staff-portal-full-chromium-linux.png
│   ├── register-full-chromium-linux.png
│   ├── login-full-chromium-linux.png
│   ├── patients-full-chromium-linux.png
│   └── provider-consultation-full-chromium-linux.png
```

Note: Accessibility tests don't generate snapshots (they test for violations, not visuals).

---

## Troubleshooting

### Tests Still Fail After Committing Snapshots

**Check:**
1. Did you commit to the `__snapshots__` directory? ✅
2. Did you push the changes? ✅
3. Are the file names correct (with platform suffix)? ✅

```bash
# Verify snapshots are in git
git log --name-status -1
# Should show new snapshot files

# Verify they're actually committed
git ls-files | grep snapshots
```

### Snapshots Generated But Tests Still Fail

Run locally to debug:
```bash
npm run test:playwright -- --headed
# This opens browser so you can see what's happening
```

### Need to Update Snapshots Later

If UI changes:
```bash
npm run test:playwright -- --update-snapshots
git add tests/playwright/__snapshots__
git commit -m "chore: update snapshots after UI changes"
git push
```

---

## Next Steps (After Setup)

1. ✅ Generate snapshots locally: `npm run test:playwright`
2. ✅ Review snapshots look correct
3. ✅ Commit to git: `git add tests/playwright/__snapshots__`
4. ✅ Push to trigger CI
5. ✅ Verify all tests pass in GitHub Actions
6. ✅ Done! Tests will now catch visual regressions automatically 🎉

---

## Snapshot Testing Benefits

After this setup, every change to the frontend will:
- ✨ Automatically check for visual regressions
- ✨ Catch unintended CSS changes
- ✨ Verify responsive design works
- ✨ Run accessibility checks on all pages
- ✨ Compare against baseline snapshots
- 🚀 Prevent shipping broken UI changes

