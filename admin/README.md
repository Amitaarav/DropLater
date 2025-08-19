# Webhook Scheduler – Admin Frontend

This is the Admin Frontend for managing scheduled webhook deliveries.
It provides a simple UI for:

- Creating new scheduled notes (with webhook delivery).

- Viewing, filtering, and paginating existing notes.

- Replaying failed or dead notes.

The app is built with React, Framer Motion, React Hook Form, Axios, and Day.js, styled with TailwindCSS.

## Project Structure
```
admin/
│── public/                 # Static assets
│── src/
│   ├── api/                # API utilities
│   │   └── notes.js        # Axios client + API methods
│   ├── components/         # Reusable UI components
│   │   ├── NoteForm.jsx    # Form to create new note
│   │   └── NoteTable.jsx   # Table to display/manage notes
│   ├── App.jsx             # Main app with routing + state
│   ├── App.css             # Global styles
│   └── main.jsx            # React entry point
│
├── .env.example            # Example environment variables
├── package.json            # Dependencies & scripts
├── vite.config.js          # Vite config
└── README.md               # Project guide (this file)
```
### Tech Stack

- React 18 – UI framework

- Vite – Build tool & dev server

- Axios – API requests

- React Hook Form – Form handling & validation

- Framer Motion – Animations

- Day.js – Date & time formatting

- TailwindCSS – Styling

###  Getting Started
1. Clone the Repository
```
git clone https://github.com/Amitaarav/DropLater/tree/amit/admin
cd admin-fe
```
2. Install Dependencies
```
npm install
```
3. Setup Environment Variables

Create a .env file in the root folder (based on .env.example):
```
VITE_API_URL=http://localhost:3000
VITE_ADMIN_TOKEN=your-secret-admin-token-here


VITE_API_URL → Backend API base URL

VITE_ADMIN_TOKEN → Admin authentication token (used in API requests)
```
4. Run in Development
```
npm run dev
```

App runs at 👉 http://localhost:5173/ (by default with Vite).

5. Build for Production
```
npm run build
```

Build output will be in the dist/ folder.

### Features

- Note Creation

- Add title, body, release time, and webhook URL.

- Validations for required fields, URL format, and max lengths.

- Notes Management

- View all scheduled notes in a table.

- Status badges: pending, delivered, failed, dead.

- Pagination support.

- Filter by status.

- Replay Failed Notes

- Replay webhook deliveries for failed or dead notes.

- Visual feedback when replay is in progress.

- UX Enhancements

- Smooth animations with Framer Motion.

- Loading states, error states, and success feedback.

### Available Scripts
```
npm run dev → Start dev server

npm run build → Build for production

npm run preview → Preview production build
```
### API Endpoints Used

The frontend expects a backend with these routes:
```
POST /api/notes → Create a new note

GET /api/notes → Fetch notes (supports pagination & filtering by status)

GET /api/notes/:id → Get single note

POST /api/notes/:id/replay → Replay failed/dead note
```
Authorization: Bearer <VITE_ADMIN_TOKEN>

### Example Workflow

1. Open the app.

2. Create a new scheduled note (with release time + webhook URL).

3. View the note in the table.

4. If a note fails, replay it from the table.