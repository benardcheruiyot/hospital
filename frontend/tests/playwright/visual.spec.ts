import { test, expect } from '@playwright/test';

test('landing page visual snapshot', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('h1, h2, .reference-portal-grid');
  const hero = await page.locator('main').first();
  expect(await hero.screenshot()).toMatchSnapshot('landing-hero.png');
});
