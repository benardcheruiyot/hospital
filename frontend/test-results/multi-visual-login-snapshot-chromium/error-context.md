# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: multi-visual.spec.ts >> login snapshot
- Location: tests\playwright\multi-visual.spec.ts:28:3

# Error details

```
Error: A snapshot doesn't exist at C:\Users\bcher\Desktop\hospital-digital-platform\frontend\tests\playwright\multi-visual.spec.ts-snapshots\login-full-chromium-win32.png, writing actual.
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
     |                                                       ^ Error: A snapshot doesn't exist at C:\Users\bcher\Desktop\hospital-digital-platform\frontend\tests\playwright\multi-visual.spec.ts-snapshots\login-full-chromium-win32.png, writing actual.
  46 |   });
  47 | }
  48 | 
```