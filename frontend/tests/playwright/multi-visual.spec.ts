import { test, expect } from '@playwright/test';

const PAGES = [
  { path: '/', name: 'landing' },
  { path: '/portal/patient', name: 'patient-portal' },
  { path: '/portal/staff', name: 'staff-portal' },
  { path: '/register', name: 'register' },
  { path: '/login', name: 'login' },
  { path: '/patients', name: 'patients' },
  { path: '/provider/consultation', name: 'provider-consultation' },
];

// Basic fixtures to mock API responses for deterministic snapshots
const fixtures = {
  '/api/auth/me': { data: { id: 1, firstName: 'benard', lastName: 'cheruiyot', role: 'doctor', unreadMessages: 2 } },
  '/api/patients': { data: [
    { id: 11, User: { firstName: 'Mary', lastName: 'Wambui', email: 'mary@example.com', phone: '0712345678' }, registrationStatus: 'verified', status: 'waiting' },
    { id: 12, User: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '0711111111' }, registrationStatus: 'pending', status: 'waiting' }
  ]},
  '/api/appointments': { data: [
    { id: 101, scheduledAt: new Date(Date.now() + 3600 * 1000).toISOString(), status: 'scheduled', type: 'telemedicine', Patient: { User: { firstName: 'Mary', lastName: 'Wambui' } }, TelemedicineSession: { roomCode: 'RM123' }, reason: 'Follow-up' }
  ]},
  '/api/telemedicine/sessions': { data: [] },
  '/api/analytics/overview': { data: { totalPatients: 128, completedAppointments: 54, telemedicineAppointments: 12, completionRate: 92 } },
};

for (const p of PAGES) {
  test(`${p.name} snapshot`, async ({ page }) => {
    // Intercept common API endpoints
    await page.route('**/api/*', (route) => {
      const url = route.request().url();
      const path = url.replace(route.request().frame().url().split('/').slice(0,3).join('/'), '');
      // Try to match known fixture keys by pathname
      const pathname = new URL(url).pathname;
      if (fixtures[pathname]) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixtures[pathname]) });
      } else {
        route.continue();
      }
    });

    await page.goto(p.path);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('h1, h2, main, .main-content', { state: 'visible' });
    await page.waitForTimeout(500);
    expect(await page.screenshot({ fullPage: true })).toMatchSnapshot(`${p.name}-full.png`);
  });
}
