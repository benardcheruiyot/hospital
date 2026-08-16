# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility.spec.ts >> a11y check /portal/patient
- Location: tests\playwright\accessibility.spec.ts:6:3

# Error details

```
ReferenceError: require is not defined
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: ✚
      - generic [ref=e7]:
        - strong [ref=e8]: TERRALINK Health
        - generic [ref=e9]: Patient Portal
    - link "Sign in" [ref=e11] [cursor=pointer]:
      - /url: /login?portal=patient
  - generic [ref=e13]:
    - generic [ref=e14]: Patient Portal
    - heading "Welcome to your care workspace" [level=1] [ref=e15]
    - paragraph [ref=e16]: Book appointments, view records, pay bills, and access telemedicine services.
    - generic [ref=e17]:
      - link "Enter Portal →" [ref=e18] [cursor=pointer]:
        - /url: /login?portal=patient
      - link "Register" [ref=e19] [cursor=pointer]:
        - /url: /register
  - generic [ref=e21]:
    - article [ref=e22]:
      - generic [ref=e23]: 📅
      - generic [ref=e24]:
        - heading "Appointments" [level=2] [ref=e25]
        - paragraph [ref=e26]: Book, review, and check in for visits.
    - article [ref=e27]:
      - generic [ref=e28]: 💬
      - generic [ref=e29]:
        - heading "Messages" [level=2] [ref=e30]
        - paragraph [ref=e31]: Secure messages with care teams.
    - article [ref=e32]:
      - generic [ref=e33]: 📄
      - generic [ref=e34]:
        - heading "Records" [level=2] [ref=e35]
        - paragraph [ref=e36]: View your visit notes and documents.
    - article [ref=e37]:
      - generic [ref=e38]: 📺
      - generic [ref=e39]:
        - heading "Telemedicine" [level=2] [ref=e40]
        - paragraph [ref=e41]: Join virtual consultations in one click.
  - contentinfo [ref=e42]:
    - generic [ref=e43]:
      - strong [ref=e44]: TERRALINK Health
      - generic [ref=e45]: Digital Hospital Management Platform
    - paragraph [ref=e46]: © 2026 TERRALINK Health — Digital Hospital Management Platform
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const pages = ['/', '/portal/patient', '/portal/staff', '/register', '/login', '/patients'];
  4  | 
  5  | for (const p of pages) {
  6  |   test(`a11y check ${p}`, async ({ page }) => {
  7  |     await page.goto(p);
  8  |     // inject axe-core
  9  |     // eslint-disable-next-line @typescript-eslint/no-var-requires
> 10 |     const axe = require('axe-core');
     |                 ^ ReferenceError: require is not defined
  11 |     await page.addScriptTag({ content: axe.source });
  12 |     const results = await page.evaluate(async () => await (window as any).axe.run());
  13 |     const violations = results.violations || [];
  14 |     if (violations.length > 0) {
  15 |       // log violations for debugging
  16 |       console.log(`Accessibility violations on ${p}:`, JSON.stringify(violations.map((v: any) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })), null, 2));
  17 |     }
  18 |     expect(violations.length).toBe(0);
  19 |   });
  20 | }
  21 | 
```