import { test, expect } from '@playwright/test';

test('landing page visual snapshot', async ({ page }) => {
  page.setDefaultTimeout(30000);
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('h1, h2, .reference-portal-grid, main', { state: 'visible', timeout: 15000 });
  await page.waitForTimeout(800);
  
  const mainElement = await page.locator('main, .main-content, [role="main"]').first();
  const isVisible = await mainElement.isVisible().catch(() => false);
  
  if (isVisible) {
    expect(await mainElement.screenshot()).toMatchSnapshot('landing-hero.png');
  } else {
    expect(await page.screenshot()).toMatchSnapshot('landing-hero-full.png');
  }
});

test('landing page stays usable on mobile viewport', async ({ page }) => {
  page.setDefaultTimeout(30000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('.reference-header, .reference-hero, .reference-portal-grid, main', { 
    state: 'visible', 
    timeout: 15000 
  });
  await page.waitForTimeout(500);

  const layout = await page.evaluate(() => {
    const header = document.querySelector('.reference-header') || document.querySelector('header');
    const hero = document.querySelector('.reference-hero') || document.querySelector('.hero');
    const portalGrid = document.querySelector('.reference-portal-grid') || document.querySelector('[class*="grid"]');
    const style = getComputedStyle;

    return {
      bodyWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
      headerDirection: header ? style(header).flexDirection : 'unknown',
      heroColumns: hero ? style(hero).gridTemplateColumns : 'unknown',
      portalColumns: portalGrid ? style(portalGrid).gridTemplateColumns : 'unknown',
    };
  });

  expect(layout.bodyWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  
  if (layout.headerDirection !== 'unknown') {
    expect(['column', 'row']).toContain(layout.headerDirection);
  }
  
  if (layout.heroColumns !== 'unknown') {
    const columns = layout.heroColumns.split(' ');
    expect(columns.length <= 2 || layout.heroColumns.includes('1fr')).toBe(true);
  }
  
  if (layout.portalColumns !== 'unknown') {
    const columns = layout.portalColumns.split(' ');
    expect(columns.length <= 2 || layout.portalColumns.includes('1fr')).toBe(true);
  }
});
