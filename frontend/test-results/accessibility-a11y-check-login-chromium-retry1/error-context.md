# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility.spec.ts >> a11y check /login
- Location: tests\playwright\accessibility.spec.ts:6:3

# Error details

```
ReferenceError: require is not defined
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: ✚
      - generic [ref=e7]:
        - generic [ref=e8]: TERRALINK Health
        - heading "Secure portal access" [level=2] [ref=e9]
    - link "Create account" [ref=e11] [cursor=pointer]:
      - /url: /register
  - generic [ref=e12]:
    - generic [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e15]: Secure access
        - generic [ref=e16]: Unified login
        - generic [ref=e17]: Role-aware workspace
      - generic [ref=e18]: One shared workspace for patients and hospital staff
      - heading "Sign in to your care workspace" [level=1] [ref=e19]
      - paragraph [ref=e20]: Sign in to manage your appointments, registration, messaging, and telehealth care.
      - generic [ref=e21]:
        - generic [ref=e22]:
          - generic [ref=e23]: Patient access
          - strong [ref=e24]: Your care tools ready in one place
        - generic [ref=e25]:
          - generic [ref=e26]: Shared platform
          - strong [ref=e27]: Same ecosystem for patients and staff
      - generic [ref=e28]:
        - generic [ref=e29]:
          - generic [ref=e30]: Patient journey
          - strong [ref=e31]: Appointments, intake, follow-up
        - generic [ref=e32]:
          - generic [ref=e33]: Connected care
          - strong [ref=e34]: One account for your health experience
      - generic [ref=e35]:
        - generic [ref=e36]: Secure sign-in with the same workspace for every role
        - generic [ref=e37]: Patient and staff portals in one unified platform
        - generic [ref=e38]: Telemedicine, messaging, and scheduling together
    - generic [ref=e39]:
      - paragraph [ref=e40]: Shared portal access
      - heading "Patient Portal Sign In" [level=2] [ref=e41]
      - paragraph [ref=e42]: Enter your email and password to access your patient care tools.
      - tablist "Choose login portal" [ref=e43]:
        - button "Patient" [ref=e44] [cursor=pointer]
        - button "Staff" [ref=e45] [cursor=pointer]
      - generic [ref=e46]:
        - generic [ref=e47]:
          - text: Email
          - textbox "Email" [ref=e48]
        - generic [ref=e49]:
          - text: Password
          - textbox "Password" [ref=e50]
        - button "Sign in" [ref=e51] [cursor=pointer]
        - button "G Sign in with Google" [ref=e52] [cursor=pointer]:
          - generic [ref=e53]: G
          - text: Sign in with Google
      - paragraph [ref=e54]:
        - text: Don't have an account?
        - link "Register" [ref=e55] [cursor=pointer]:
          - /url: /register
      - generic [ref=e56]:
        - generic [ref=e57]: Tip
        - paragraph [ref=e58]: Use the same account across dashboard, registration, messaging, and telemedicine to keep the full care journey in one place.
      - paragraph [ref=e59]:
        - link "Back to TERRALINK Health" [ref=e60] [cursor=pointer]:
          - /url: /
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