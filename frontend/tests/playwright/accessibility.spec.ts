import { test, expect } from '@playwright/test';
import axe from 'axe-core';

const pages = ['/', '/portal/patient', '/portal/staff', '/register', '/login', '/patients'];

for (const p of pages) {
  test(`a11y check ${p}`, async ({ page }) => {
    await page.goto(p);
    await page.addScriptTag({ content: axe.source });
    const results = await page.evaluate(async () => await (window as any).axe.run());
    const violations = results.violations || [];
    if (violations.length > 0) {
      // log violations for debugging
      console.log(`Accessibility violations on ${p}:`, JSON.stringify(violations.map((v: any) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((node: any) => ({ target: node.target, summary: node.failureSummary })),
      })), null, 2));
    }
    expect(violations.length).toBe(0);
  });
}
