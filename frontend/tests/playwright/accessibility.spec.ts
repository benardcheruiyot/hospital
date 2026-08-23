import { test, expect } from '@playwright/test';

const pages = ['/', '/portal/patient', '/portal/staff', '/register', '/login', '/patients'];

for (const p of pages) {
  test(`a11y check ${p}`, async ({ page }) => {
    page.setDefaultTimeout(30000);
    
    await page.goto(p, { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('h1, h2, main, .main-content', { state: 'visible', timeout: 15000 });
    await page.waitForTimeout(500);
    
    // Inject axe-core via CDN for better compatibility
    await page.addScriptTag({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js',
      type: 'text/javascript'
    });
    
    // Wait for axe to be available
    await page.waitForFunction(() => !!(window as any).axe);
    
    // Run accessibility check
    const results = await page.evaluate(async () => {
      return await (window as any).axe.run();
    });
    
    const violations = results.violations || [];
    if (violations.length > 0) {
      console.log(`Accessibility violations on ${p}:`, JSON.stringify(violations.map((v: any) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((node: any) => ({ target: node.target, summary: node.failureSummary })),
      })), null, 2));
    }
    expect(violations.length).toBe(0);
  });
}
