# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: multi-visual.spec.ts >> register snapshot
- Location: tests\playwright\multi-visual.spec.ts:28:3

# Error details

```
Error: A snapshot doesn't exist at C:\Users\bcher\Desktop\hospital-digital-platform\frontend\tests\playwright\multi-visual.spec.ts-snapshots\register-full-chromium-win32.png, writing actual.
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
  3  | const PAGES = [
  4  |   { path: '/', name: 'landing' },
  5  |   { path: '/portal/patient', name: 'patient-portal' },
  6  |   { path: '/portal/staff', name: 'staff-portal' },
  7  |   { path: '/register', name: 'register' },
  8  |   { path: '/login', name: 'login' },
  9  |   { path: '/patients', name: 'patients' },
  10 |   { path: '/provider/consultation', name: 'provider-consultation' },
  11 | ];
  12 | 
  13 | // Basic fixtures to mock API responses for deterministic snapshots
  14 | const fixtures = {
  15 |   '/api/auth/me': { data: { id: 1, firstName: 'benard', lastName: 'cheruiyot', role: 'doctor', unreadMessages: 2 } },
  16 |   '/api/patients': { data: [
  17 |     { id: 11, User: { firstName: 'Mary', lastName: 'Wambui', email: 'mary@example.com', phone: '0712345678' }, registrationStatus: 'verified', status: 'waiting' },
  18 |     { id: 12, User: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '0711111111' }, registrationStatus: 'pending', status: 'waiting' }
  19 |   ]},
  20 |   '/api/appointments': { data: [
  21 |     { id: 101, scheduledAt: new Date(Date.now() + 3600 * 1000).toISOString(), status: 'scheduled', type: 'telemedicine', Patient: { User: { firstName: 'Mary', lastName: 'Wambui' } }, TelemedicineSession: { roomCode: 'RM123' }, reason: 'Follow-up' }
  22 |   ]},
  23 |   '/api/telemedicine/sessions': { data: [] },
  24 |   '/api/analytics/overview': { data: { totalPatients: 128, completedAppointments: 54, telemedicineAppointments: 12, completionRate: 92 } },
  25 | };
  26 | 
  27 | for (const p of PAGES) {
  28 |   test(`${p.name} snapshot`, async ({ page }) => {
  29 |     // Intercept common API endpoints
  30 |     await page.route('**/api/*', (route) => {
  31 |       const url = route.request().url();
  32 |       const path = url.replace(route.request().frame().url().split('/').slice(0,3).join('/'), '');
  33 |       // Try to match known fixture keys by pathname
  34 |       const pathname = new URL(url).pathname;
  35 |       if (fixtures[pathname]) {
  36 |         route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixtures[pathname]) });
  37 |       } else {
  38 |         route.continue();
  39 |       }
  40 |     });
  41 | 
  42 |     await page.goto(p.path);
  43 |     await page.waitForLoadState('domcontentloaded');
  44 |     await page.waitForTimeout(500);
> 45 |     expect(await page.screenshot({ fullPage: true })).toMatchSnapshot(`${p.name}-full.png`);
     |                                                       ^ Error: A snapshot doesn't exist at C:\Users\bcher\Desktop\hospital-digital-platform\frontend\tests\playwright\multi-visual.spec.ts-snapshots\register-full-chromium-win32.png, writing actual.
  46 |   });
  47 | }
  48 | 
```