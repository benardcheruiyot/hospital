# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility.spec.ts >> a11y check /register
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
        - heading "Create your account" [level=2] [ref=e9]
    - link "Sign in" [ref=e11] [cursor=pointer]:
      - /url: /login
  - generic [ref=e12]:
    - generic [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e15]: Patient-first
        - generic [ref=e16]: Secure access
      - generic [ref=e17]: Get started with secure patient portal access
      - heading "One account for appointments, messaging, and care coordination" [level=1] [ref=e18]
      - paragraph [ref=e19]: Create a secure account to manage appointments, registration, messages, and virtual visits in one polished care workspace.
      - generic [ref=e20]:
        - generic [ref=e21]:
          - generic [ref=e22]: Fast registration
          - strong [ref=e23]: Set up your patient account and access care tools quickly
        - generic [ref=e24]:
          - generic [ref=e25]: Connected care
          - strong [ref=e26]: Secure access for patients to appointments, messages, and telehealth
      - generic [ref=e27]:
        - generic [ref=e28]:
          - generic [ref=e29]: Patient intake
          - strong [ref=e30]: Complete forms, verify details, and prepare for care
        - generic [ref=e31]:
          - generic [ref=e32]: Platform access
          - strong [ref=e33]: Unified navigation for patients and providers
      - generic [ref=e34]:
        - generic [ref=e35]: Encrypted registration and secure patient profiles
        - generic [ref=e36]: Scheduling, messaging, and follow-up in one place
        - generic [ref=e37]: A seamless patient experience across care pathways
    - generic [ref=e38]:
      - paragraph [ref=e39]: Patient registration
      - heading "Create your TERRALINK Health patient account" [level=2] [ref=e40]
      - paragraph [ref=e41]: Register to manage appointments, messages, and telehealth care securely.
      - generic [ref=e42]:
        - generic [ref=e43]:
          - generic [ref=e44]:
            - text: First name
            - textbox "First name" [ref=e45]
          - generic [ref=e46]:
            - text: Last name
            - textbox "Last name" [ref=e47]
        - generic [ref=e48]:
          - text: Email
          - textbox "Email" [ref=e49]
        - generic [ref=e50]:
          - text: Phone
          - textbox "Phone" [ref=e51]
        - generic [ref=e52]:
          - text: Password (min. 8 characters)
          - textbox "Password (min. 8 characters)" [ref=e53]
        - button "Register" [ref=e54] [cursor=pointer]
        - button "G Sign up with Google" [ref=e55] [cursor=pointer]:
          - generic [ref=e56]: G
          - text: Sign up with Google
      - paragraph [ref=e57]:
        - text: Already have an account?
        - link "Sign in" [ref=e58] [cursor=pointer]:
          - /url: /login
      - generic [ref=e59]:
        - generic [ref=e60]: What you'll get
        - paragraph [ref=e61]: A patient account that unlocks appointments, messaging, and virtual care while keeping your care journey connected with providers.
      - paragraph [ref=e62]:
        - link "Back to overview" [ref=e63] [cursor=pointer]:
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