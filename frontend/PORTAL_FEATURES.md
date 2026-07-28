# Portal Feature Inventory

This file lists features and UI modules captured from the demo (TERRALINK Health) for implementation and parity.

## Public Landing (demo)
- Brand: "TERRALINK Health" — "Digital Hospital Platform" / "Digital Hospital Management Platform"
- Headline: "TERRALINK Health" (company headline on hero)
- Sub: "Enhancing Hospital Operations & Patient Experience"
- Description: "An integrated digital platform for patient engagement, digital registration, telemedicine, and real-time analytics — built for Kenyan hospitals."
- CTA: "Get Started", "Sign In"
- Feature tiles: "Reduced Wait Times", "Secure Records", "Telemedicine", "Real-Time Analytics"
- Role entry: "Access Your Portal" with "Patient Portal" and "Healthcare Provider" cards
  - Patient Portal card copy: "Book appointments, view records, pay bills, and access telemedicine services." CTA: "Enter Portal →"
  - Provider card copy: "Manage patients, record consultations, order tests, and view schedules." CTA: "Enter Portal →"

## Patient Portal (implemented pages)
- Hero: Kicker "Patient Portal", Headline "Welcome to your care workspace"
- Description (exact): "Book appointments, view records, pay bills, and access telemedicine services."
- CTA: "Enter Portal →" and secondary "Register"
- Feature tiles (appointments, messages, records, telemedicine)
- Footer: "© 2026 TERRALINK Health — Digital Hospital Management Platform"

## Provider / Staff (demo pages captured)
- Top navigation: Dashboard, Patients, Consultation, My Schedule, Lab Orders
- Dashboard features:
  - Greeting: "Good Morning, Dr. benard cheruiyot 👋" and date
  - Quick action: "Start Teleconsult"
  - KPIs: "Today's Appointments", "Waiting Patients", "Completed Today", "Critical Alerts"
  - Waiting Patients list with triage labels (Urgent, Normal) and actions: "Attend"
  - Critical Lab Alert card (example copy): "Patient Mary Wambui — Potassium level: 6.2 mEq/L (Critical High). Immediate review required." CTA: "Review"
- Patients page:
  - Heading: "Patients"
  - Search box: "Search patients..."
  - Patient cards list with initials, name, age/gender/reason and status badges (Waiting, In Progress, Completed)
- Consultation page:
  - Heading: "Consultation"
  - Telemedicine Session panel with "Start Video Call" button
  - Patient Summary: Name, Age, Gender, Chief Complaint, Priority (Urgent/Normal), Allergies, Vitals (BP, HR, Temp, SpO2)
  - Clinical Documentation tabs: "Consultation Notes", "Diagnosis", "Prescription (0)", "Lab / Imaging Orders" and a "Save Notes" button
- My Schedule page:
  - Heading: "My Schedule"
  - Availability toggles for weekdays
  - Today's Schedule list with time slots and statuses (In Progress, Waiting, Scheduled)
- Lab Orders page:
  - Heading: "Lab Orders & Results"
  - Tabs: "Pending (4)", "Completed (2)"
  - Order items with test name, patient reference, priority (Urgent, STAT, Routine), ordering clinician, and status (Pending/In Progress)

## Auth / Flow notes
- Demo uses passwordless magic links and Google OAuth for sign-in flows (visible messages: "Check your email! We've sent a magic link to ...")
- Role-specific sign-in flows: `?portal=patient` and `?portal=staff` query param examples exist in local pages.

## Implementation recommendations (best practice)
1. Create a canonical feature inventory (this file) to track coverage.
2. Prioritize implementing interactive modules: Patients list, Consultation notes (forms), Telemedicine start flow (stub video call), Schedule view, Lab orders.
3. For visual parity, split work into iterations: Hero & CTAs → Feature tiles → Dashboard KPI cards → Lists & modals → Responsive refinements.
4. Add automated snapshot tests (visual regression) for key pages: landing, patient portal hero, provider dashboard.
5. Wire auth query params so CTAs land on the correct role flows: `/login?portal=patient`, `/login?portal=staff`.

## Local implementation notes
- Landing portal cards now point to local inner pages: `/portal/patient` and `/portal/staff`.
- Patient and staff inner pages replicated locally for visual parity and iterative refinement.

