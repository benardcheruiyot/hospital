import { test, expect } from '@playwright/test';

test('landing page visual snapshot', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('h1, h2, .reference-portal-grid');
  const hero = await page.locator('main').first();
  expect(await hero.screenshot()).toMatchSnapshot('landing-hero.png');
});

test('landing page stays usable on mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForSelector('.reference-header, .reference-hero, .reference-portal-grid');

  const layout = await page.evaluate(() => {
    const header = document.querySelector('.reference-header');
    const hero = document.querySelector('.reference-hero');
    const portalGrid = document.querySelector('.reference-portal-grid');
    const style = getComputedStyle;

    return {
      bodyWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
      headerDirection: style(header).flexDirection,
      heroColumns: style(hero).gridTemplateColumns,
      portalColumns: style(portalGrid).gridTemplateColumns,
    };
  });

  expect(layout.bodyWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.headerDirection).toBe('column');
  expect(layout.heroColumns).toContain('1fr');
  expect(layout.portalColumns).toContain('1fr');
});
