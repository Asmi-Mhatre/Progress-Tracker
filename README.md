Life OS — Phase 1

A personal life management system designed to bring your goals, tasks, and daily priorities into one organized dashboard.

Phase 1 is a working, deployable core built with Next.js.

Features
1. Dashboard
Live clock and today's date.
"What should I be doing now?" panel.
Displays overdue and due-today tasks.
Complete tasks directly from the dashboard.
Displays intended goal priorities as importance shares.
Clearly indicates when there is insufficient data for comparisons.
2. My Goals
14 preloaded goals across five categories:
Academics
Career
Startup
Personal
Financial
Add new goals.
Edit existing goals.
Set importance from 1 to 5.
Assign target dates.
Pause, complete, or delete goals.
3. Tasks
Create tasks and associate them with goals.
Set due dates, estimated duration, and priority.
Search tasks.
Mark tasks as complete.
Delete tasks.
4. Settings
Export application data as JSON.
Import JSON backups.
Validate imported data before use.
5. Design and Storage
Minimal, responsive interface.
Light and dark modes.
Collapsible sidebar.
Mobile-friendly navigation.
Browser localStorage persistence.
Technology
Next.js
React
JavaScript / TypeScript (as configured in the project)
CSS / Tailwind CSS (as configured in the project)
Browser localStorage
Getting Started
Prerequisites

Install:

Node.js (LTS recommended)
npm
Git (optional for local development)
Installation

Clone the repository:

bash
git clone YOUR_GITHUB_REPOSITORY_URL


Navigate into the project:

bash
cd life-os


Install dependencies:

bash
npm install


Start the development server:

bash
npm run dev


Open:

text
http://localhost:3000

Production Build

To check whether the application builds successfully:

bash
npm run build


To run the production version locally:

bash
npm run start

Deployment on Vercel

Life OS can be deployed directly from GitHub.

Push the project to a GitHub repository.
Visit https://vercel.com/.
Sign in using GitHub.
Select Add New → Project.
Import the Life OS repository.
Configure the project:
Setting	Value
Framework	Next.js
Root Directory	./
Install Command	npm install
Build Command	npm run build
Output Directory	Default
No environment variables are required for Phase 1.
Click Deploy.

Vercel will build and publish the application.

Data Storage and Backups

Phase 1 uses browser localStorage.

This means:

Data is stored locally in the browser.
There is no account or login system.
Data does not automatically synchronize across devices.
Clearing browser storage may permanently remove saved information.

Recommended: Regularly export your data through Settings and keep a backup JSON file.

Current Limitations

The following features are not included in Phase 1:

Cloud synchronization and authentication.
Task subtasks and dependencies.
Recurring tasks.
Automatic schedule-aware planning.
Browser notifications.
Calendar integration.
Analytics and performance reviews.
Development Roadmap
Phase 1 — Core Life OS
Dashboard
Goals management
Task management
Local storage
JSON import/export

Status: Built

Phase 2 — Time Management
24-hour planner
Fixed and flexible time blocks
Missed-task queue
Focus timer
Calendar integration
Schedule-aware dashboard
Phase 3 — Academic Management
Exams management
Syllabus tree
Mock test tracker
Performance charts
Mistake journal
Phase 4 — Reminders and Opportunities
Reminders
Opportunity tracker
Browser notifications
Phase 5 — Analytics and Reviews
Progress analytics
Performance tracking
Daily, weekly, and monthly reviews
Phase 6 — Cloud and Polish
Supabase authentication
Cloud synchronization
Installable app support
Final UI and performance improvements
Contributing

This is a personal project. Development is planned in phases to keep each release stable and deployable.

License

All rights reserved unless a separate license is added to this repository.

Life OS — Organize your goals. Manage your time. Build your future.
