# Flux — Personal CRM

Flux is a minimalist, cadence-based personal CRM built to solve a simple problem: **being bad at staying in touch with the people who matter.** 

Instead of traditional, sales-heavy CRM tools with complex pipelines and corporate bloat, Flux is designed from the ground up for personal relationship management. It categorizes your circle into concentric tiers (Core, Active, Loose) and tracks when it's time to reach out next, helping you maintain a consistent and meaningful rhythm with your network.

---

## Design Philosophy
*   **Minimalist & Aesthetic:** A sleek dark-themed workspace that puts your people first.
*   **Low Friction:** Quickly log touchpoints, capture context notes, and see who is due for a check-in.
*   **Cadence-Driven:** Shift focus from "transactions" to "relationship rhythm."

---

## Key Features

*   **Relationship Rings (Tiers):**
    *   **Core:** Mentors, close collaborators, and active goal partners (default: every 3–4 weeks).
    *   **Active:** Former teammates, builder peers, and industry friends (default: every 3 months).
    *   **Loose:** Alumni, distant acquaintances, and recruiters (default: every 6–12 months).
*   **Cloud Synchronization:** Syncs data seamlessly to a Supabase database, falling back to local cache if offline.
*   **Daily Email Reminders:** An automated script run daily via GitHub Actions queries your database and emails you a summary of everyone due for contact. Set your notification email directly in the app.
*   **Custom Cadences:** Fine-tune the touchpoint intervals for each ring directly in the workspace settings.
*   **Timeline & Notes:** Document your last touchpoint method (Email, Phone, Text, LinkedIn, In Person) and keep brief, high-level context notes.
*   **Today View:** A dedicated dashboard for contacts who are currently due or upcoming for a touchpoint.
*   **CSV/JSON Import:** Smoothly import existing contact lists. Imported contacts are automatically queued in the `Loose` ring so you can organize them at your own pace.
*   **Keyboard Shortcuts:** Navigate between your relationship rings instantly using `Ctrl + 1` (Core), `Ctrl + 2` (Active), and `Ctrl + 3` (Loose).

---

## Tech Stack

*   **Frontend:** React (Vite)
*   **Desktop Shell:** Electron
*   **Database & API:** Supabase (PostgreSQL)
*   **Email Deliverability:** Resend (Email API)
*   **Scheduler:** GitHub Actions (Cron runner)
*   **Icons:** Lucide React

---

## Getting Started

### Prerequisites
*   Node.js (v20 or higher recommended)
*   npm
*   A free [Supabase](https://supabase.com) account
*   A free [Resend](https://resend.com) account

### Database Setup
Run the following commands in the Supabase SQL Editor to initialize your database tables:

```sql
-- 1. Contacts Table
create table contacts (
  id bigint primary key generated always as identity,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  role text,
  company text,
  location text,
  tier text default 'Active',
  initials text,
  color text default 'blue',
  last text default 'Not yet',
  next text default 'Today',
  note text,
  activity text,
  connected_with text
);

-- 2. Settings Table
create table settings (
  key text primary key,
  value text
);
```

### Installation & Local Run
1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd flux
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory:
   ```ini
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the application locally:
   ```bash
   npm run desktop
   ```

---

## Daily Reminder Setup (GitHub Actions)

To set up the automated daily email digests:
1. Deploy your repository to GitHub.
2. In the GitHub repository settings, go to **Settings > Secrets and variables > Actions** and click **New repository secret**.
3. Create the following three secrets:
   *   `SUPABASE_URL`: Your Supabase Project URL.
   *   `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase **service_role** API key (needed to read settings/contacts).
   *   `RESEND_API_KEY`: Your Resend API Key.
   *   `NOTIFICATION_EMAIL`: (Optional) Fallback email address in case you haven't set one in your app's Settings panel.
4. Set your notification email in the **Settings** view of your local Flux app. The workflow will read it from the database and email you at that address.