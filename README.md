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
*   **Custom Cadences:** Fine-tune the touchpoint intervals for each ring directly in the workspace settings.
*   **Timeline & Notes:** Document your last touchpoint method (Email, Phone, Text, LinkedIn, In Person) and keep brief, high-level context notes.
*   **Today View:** A dedicated dashboard for contacts who are currently due or upcoming for a touchpoint.
*   **CSV/JSON Import:** Smoothly import existing contact lists. Imported contacts are automatically queued in the `Loose` ring so you can organize them at your own pace.
*   **Keyboard Shortcuts:** Navigate between your relationship rings instantly using `Ctrl + 1` (Core), `Ctrl + 2` (Active), and `Ctrl + 3` (Loose).

---

## Tech Stack

*   **Frontend:** React (Vite)
*   **Desktop Shell:** Electron
*   **Styling:** Custom CSS with modern typography (Manrope, DM Mono, Nunito Sans)
*   **Icons:** Lucide React

---

## Getting Started

### Prerequisites
*   Node.js (v18 or higher recommended)
*   npm

### Installation
1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd flux
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Development
To launch the application in development mode with hot-reloading:
```bash
npm run desktop
```
This runs Vite dev server and spawns the Electron shell wrapper.

### Building & Packaging
To build the static frontend assets and package the desktop app:
```bash
npm run build:desktop
```
Installers and executables will be output to the `release/` directory.