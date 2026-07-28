import { test, expect } from '@playwright/test';

const pages = ['/', '/portal/patient', '/portal/staff', '/register', '/login', '/patients'];

for (const p of pages) {
  test(`a11y check ${p}`, async ({ page }) => {
    await page.goto(p);
    // inject axe-core
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const axe = require('axe-core');
    await page.addScriptTag({ content: axe.source });
    const results = await page.evaluate(async () => await (window as any).axe.run());
    const violations = results.violations || [];
    if (violations.length > 0) {
      // log violations for debugging
      console.log(`Accessibility violations on ${p}:`, JSON.stringify(violations.map((v: any) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })), null, 2));
    }
    expect(violations.length).toBe(0);
  });
}
