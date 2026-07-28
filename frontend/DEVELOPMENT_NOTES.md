# Development & Best Practices — Frontend

This document captures recommended best practices for developing, testing, and shipping the frontend work (portal cloning and parity).

1. Local setup

- Node.js: use an LTS release (recommended v18+).
- Install dependencies and run dev server:

```bash
cd frontend
npm install
npm run dev
```

- Lint and type checks (if enabled):

```bash
npm run lint
```

2. Branching & commits

- Create a feature branch for each major change: `feature/portal-parity`.
- Keep commits small and focused (layout, styles, interactions, tests).
- Open a draft PR early to capture visual diffs and feedback.

3. Visual parity workflow

- Iteratively implement pages in these phases:
  1) Static layout and content (HTML/JSX).
  2) Global styles and variables (colors, spacing, typography).
  3) Component refinement (buttons, cards, hero art).
  4) Responsive polish and accessibility tweaks.
  5) Visual regression snapshots.

- Use a visual regression tool (Percy, Chromatic, or Playwright snapshots) to assert parity.

4. Testing

- Unit tests: use `vitest` (fast + Vite-friendly) for small components.
- E2E: use `Playwright` for critical flows: landing hero, patient portal sign-in CTA, provider dashboard snapshot.
- Accessibility: run `axe` or Playwright a11y checks as part of CI.

5. CI/CD

- Add a GitHub Actions workflow with steps to:
  - Install, lint, and run unit tests
  - Build the frontend
  - Run Playwright visual snapshots (if configured)
  - Deploy preview build (optional)

6. Performance & accessibility

- Optimize images and inline SVGs; prefer vector artwork for hero elements.
- Ensure color contrast meets WCAG AA for body text and primary CTAs.
- Add `alt` text for images and aria attributes for interactive controls.

7. Small checklist for this project

- [x] Feature inventory: `PORTAL_FEATURES.md`
- [x] Patient & Staff inner pages (static)
- [x] Provider pages: consultation, schedule, lab (stubs)
- [x] Patients roster with Attend navigation
- [ ] Visual regression snapshots (add Playwright/visual tool)
- [ ] Accessibility audit (axe / Playwright checks)
- [ ] Unit tests for critical components
- [ ] CI workflow with build + tests

Notes

- You can run the dev server and review pages at:
  - `/` → landing
  - `/portal/patient` → patient portal
  - `/portal/staff` → staff portal
  - `/dashboard` → authenticated dashboard (requires auth)
  - `/patients` → patients roster (requires doctor/admin)

If you want, I can add example Playwright snapshot tests and a GitHub Actions workflow next.
