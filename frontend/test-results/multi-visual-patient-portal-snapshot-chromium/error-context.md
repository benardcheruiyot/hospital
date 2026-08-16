# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: multi-visual.spec.ts >> patient-portal snapshot
- Location: tests\playwright\multi-visual.spec.ts:28:3

# Error details

```
Error: A snapshot doesn't exist at C:\Users\bcher\Desktop\hospital-digital-platform\frontend\tests\playwright\multi-visual.spec.ts-snapshots\patient-portal-full-chromium-win32.png, writing actual.
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
     |                                                       ^ Error: A snapshot doesn't exist at C:\Users\bcher\Desktop\hospital-digital-platform\frontend\tests\playwright\multi-visual.spec.ts-snapshots\patient-portal-full-chromium-win32.png, writing actual.
  46 |   });
  47 | }
  48 | 
```