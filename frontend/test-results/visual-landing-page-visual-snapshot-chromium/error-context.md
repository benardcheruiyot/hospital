# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual.spec.ts >> landing page visual snapshot
- Location: tests\playwright\visual.spec.ts:3:1

# Error details

```
TimeoutError: locator.screenshot: Timeout 5000ms exceeded.
Call log:
  - waiting for locator('main').first()

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - link "✚ TERRALINK Health Digital Hospital Platform" [ref=e5] [cursor=pointer]:
      - /url: /
      - generic [ref=e6]: ✚
      - generic [ref=e7]:
        - strong [ref=e8]: TERRALINK Health
        - generic [ref=e9]: Digital Hospital Platform
    - generic [ref=e10]:
      - link "Patient Login" [ref=e11] [cursor=pointer]:
        - /url: /portal/patient
      - link "Staff Login" [ref=e12] [cursor=pointer]:
        - /url: /portal/staff
  - generic [ref=e13]:
    - generic [ref=e14]:
      - generic [ref=e17]: ✚
      - generic [ref=e18]:
        - text: 24/7
        - strong [ref=e19]: Connected care
      - generic [ref=e20]:
        - text: Live queue
        - strong [ref=e21]: Updated now
    - generic [ref=e22]:
      - generic [ref=e23]: ✦ Transforming Healthcare in Kenya
      - heading "Enhancing Hospital Operations & Patient Experience" [level=1] [ref=e24]
      - paragraph [ref=e25]: An integrated digital platform for patient engagement, digital registration, telemedicine, and real-time analytics — built for Kenyan hospitals.
      - generic [ref=e26]:
        - link "＋ Get Started — Register" [ref=e27] [cursor=pointer]:
          - /url: /register
          - generic [ref=e28]: ＋
          - text: Get Started — Register
        - link "♧ Sign In" [ref=e29] [cursor=pointer]:
          - /url: /login?portal=patient
          - generic [ref=e30]: ♧
          - text: Sign In
  - region "Platform benefits" [ref=e31]:
    - article [ref=e32]:
      - generic [ref=e33]: ↗
      - generic [ref=e34]:
        - heading "Reduced Wait Times" [level=2] [ref=e35]
        - paragraph [ref=e36]: Real-time queue tracking and online appointment booking
    - article [ref=e37]:
      - generic [ref=e38]: ▣
      - generic [ref=e39]:
        - heading "Secure Records" [level=2] [ref=e40]
        - paragraph [ref=e41]: Encrypted patient data with role-based access control
    - article [ref=e42]:
      - generic [ref=e43]: ◉
      - generic [ref=e44]:
        - heading "Telemedicine" [level=2] [ref=e45]
        - paragraph [ref=e46]: Virtual consultations from anywhere in Kenya
    - article [ref=e47]:
      - generic [ref=e48]: ▥
      - generic [ref=e49]:
        - heading "Real-Time Analytics" [level=2] [ref=e50]
        - paragraph [ref=e51]: Live dashboards for hospital performance monitoring
  - generic [ref=e52]:
    - generic [ref=e53]:
      - paragraph [ref=e54]: Your care, connected
      - heading "Access Your Portal" [level=2] [ref=e55]
      - paragraph [ref=e56]: Select your role to get started
    - generic [ref=e57]:
      - link "＋ Patient Portal Sign in to manage appointments, registration, messaging, and telemedicine. Enter Portal →" [ref=e58] [cursor=pointer]:
        - /url: /portal/patient
        - generic [ref=e59]: ＋
        - heading "Patient Portal" [level=3] [ref=e60]
        - paragraph [ref=e61]: Sign in to manage appointments, registration, messaging, and telemedicine.
        - generic [ref=e62]: Enter Portal →
      - link "♧ Healthcare Provider Sign in to manage patient workflows, schedules, and virtual consultations. Enter Portal →" [ref=e63] [cursor=pointer]:
        - /url: /portal/staff
        - generic [ref=e64]: ♧
        - heading "Healthcare Provider" [level=3] [ref=e65]
        - paragraph [ref=e66]: Sign in to manage patient workflows, schedules, and virtual consultations.
        - generic [ref=e67]: Enter Portal →
      - link "⌘ Administrator Sign in for hospital operations, user provisioning, and analytics. Enter Portal →" [ref=e68] [cursor=pointer]:
        - /url: /admin
        - generic [ref=e69]: ⌘
        - heading "Administrator" [level=3] [ref=e70]
        - paragraph [ref=e71]: Sign in for hospital operations, user provisioning, and analytics.
        - generic [ref=e72]: Enter Portal →
  - contentinfo [ref=e73]:
    - generic [ref=e74]:
      - strong [ref=e75]: TERRALINK Health
      - generic [ref=e76]: Digital Hospital Platform
    - paragraph [ref=e77]: © 2026 TERRALINK Health — Digital Hospital Management Platform
    - paragraph [ref=e78]: Enhancing Hospital Operations & Patient Experience in Nairobi County, Kenya
```

# Test source

```ts
  1 | import { test, expect } from '@playwright/test';
  2 | 
  3 | test('landing page visual snapshot', async ({ page }) => {
  4 |   await page.goto('/');
  5 |   await page.waitForSelector('h1, h2, .reference-portal-grid');
  6 |   const hero = await page.locator('main').first();
> 7 |   expect(await hero.screenshot()).toMatchSnapshot('landing-hero.png');
    |                     ^ TimeoutError: locator.screenshot: Timeout 5000ms exceeded.
  8 | });
  9 | 
```