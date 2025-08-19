# API Service

This folder contains the API service for the project.
It provides REST endpoints for clients and communicates with other services (worker, sink, and admin) via queues and databases.

## Tech Stack

- Node.js with Express

- MongoDB (for persistence)

- Redis (for caching & queues)

- BullMQ (for job queues)

- Zod (for validation)

- Pino (for logging)

- Docker (for containerization)

### Project Setup Guide
1. Initialize the Project

The first step is to create a new Node.js project with a default package.json file.
```
npm init -y
```

npm init → initializes a new Node.js project.

-y → automatically accepts all default options (so you don’t need to answer prompts).

This generates a package.json file where all dependencies and scripts will be managed.

2. Install Development Dependencies (Linting & Formatting)

Install tools to maintain clean, consistent, and error-free code.
```
npm install --save-dev eslint eslint-config-prettier prettier
```

--save-dev → Marks these as development dependencies (not bundled in production).

eslint → Linter to find and fix coding errors.

prettier → Code formatter for consistent style.

eslint-config-prettier → Disables ESLint rules that conflict with Prettier.

## This setup ensures that your codebase stays readable and standardized.

3. Install Core Dependencies

Install libraries required for databases and API functionality.
```
npm install --save mongodb redis mongoose bullmq cors dayjs dotenv pino zod express-rate-limit
```

mongodb → Official MongoDB driver.

mongoose → ODM for MongoDB.

redis → Redis client for Node.js.

bullmq → Queue management library.

cors → Middleware for cross-origin requests.

dayjs → Date handling.

dotenv → Loads environment variables.

pino → Fast JSON logger.

zod → Input validation.

express-rate-limit → Rate limiting middleware.

# After these steps, your project has:

- A package.json file

- Development tools (ESLint + Prettier)

- Database & queue libraries (MongoDB, Redis, BullMQ)

- Logging, validation, and rate-limiting tools

### Environment Variables

Create a .env file inside the api/ folder. Example:
```
# Runtime
NODE_ENV=development

# API
API_PORT=3000

# Database
MONGO_URL=mongodb://mongo:27017/app

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
# REDIS_PASSWORD=   # optional

# Queue
QUEUE_EVENTS=events
```

See root README.md for shared environment variables across services.

### Indexing Strategy (Database)

releaseAt (ascending) → Worker can quickly find due notes to enqueue.

status → Admin UI can list/filter notes efficiently.
## Notes Model (`models/Note.js`)

This file defines the **Mongoose schema and model** for Notes, which are the core entities in the system.  
Each note represents a scheduled message that will be delivered to a webhook endpoint at a specified time.

---

### Schema Fields

- **title** *(String, required, max 200)*  
  Short title of the note.  

- **body** *(String, required, max 5000)*  
  The main content of the note.  

- **releaseAt** *(Date, required, indexed)*  
  Scheduled timestamp when the note should be delivered.  

- **webhookUrl** *(String, required, regex `^https?://`)*  
  The target webhook endpoint where the note will be delivered.  

- **status** *(String, enum: `pending | delivered | failed | dead`, default: `pending`, indexed)*  
  Current delivery status of the note.  

- **attempts** *(Array of objects)*  
  Stores the history of delivery attempts, each containing:  
  - `at` → timestamp of attempt  
  - `statusCode` → HTTP response code  
  - `ok` → whether the attempt succeeded (`true`/`false`)  
  - `error` → error message if the attempt failed  

- **deliveredAt** *(Date, nullable)*  
  Timestamp when the note was successfully delivered (if applicable).  

- **timestamps** *(createdAt, updatedAt)*  
  Automatically managed by Mongoose.  

---

### Indexing Strategy

- **`releaseAt + status`** → Optimizes worker queries for fetching due notes.  
- **`status + createdAt`** → Efficient listing/filtering of notes in admin & API.  

---

### Example Document
```json

```
{
  "_id": "64e8f9b1c29f5b1c3d2a9c01",
  "title": "Project Deadline",
  "body": "Reminder: Submit report by 5 PM",
  "releaseAt": "2025-08-20T10:00:00.000Z",
  "webhookUrl": "https://example.com/webhook",
  "status": "pending",
  "attempts": [
    {
      "at": "2025-08-20T10:01:00.000Z",
      "statusCode": 500,
      "ok": false,
      "error": "Internal Server Error"
    }
  ],
  "deliveredAt": null,
  "createdAt": "2025-08-19T09:00:00.000Z",
  "updatedAt": "2025-08-19T09:10:00.000Z"
}
```

## Utilities

### 1. Logger (`logger.js`)

We use [Pino](https://github.com/pinojs/pino) as the logging library for this project.  
- In **development mode**, logs are pretty-printed using `pino-pretty` with colors and timestamps.  
- In **production mode**, logs remain in structured JSON format for better performance and log aggregation.  

**Usage Example:**
```js

```
import logger from './logger.js';

logger.info('Application started');
logger.error({ err }, 'Something went wrong');

```
Environment variables:

LOG_LEVEL → sets the log level (info, debug, error, etc.). Default: info

NODE_ENV=development → enables pretty-print logs

2. Idempotency Utility (idempotency.js)
This utility ensures idempotency of API requests or background jobs.
It generates a deterministic idempotency key using SHA-256 hash of noteId and releaseAt.

Usage Example:

js
Copy
Edit
```
import { generateIdempotencyKey } from './idempotency.js';

const key = generateIdempotencyKey('note123', '2025-08-19T10:00:00Z');
console.log(key);
// => "a3c5f4d2e1..."
```
This prevents duplicate records from being created when the same request is retried.

### API Reference
Public Routes
```
GET /health
``
Description: Health check for the service.

Access: Public

Response: { "status": "ok" }

Private Routes (require Authentication + Rate Limiting)
POST /notes

Description: Create a new note.

Access: Private

Body Example:
```
{
  "title": "Meeting Notes",
  "body": "Discuss project timelines",
  "releaseAt": "2025-08-18T12:00:00Z",
  "webhookUrl": "http://example.com/webhook"
}
```
GET /notes

Description: Fetch a list of notes.

Access: Private

Response Example:
```
[
  {
    "id": "note123",
    "title": "Meeting Notes",
    "body": "Discuss project timelines",
    "releaseAt": "2025-08-18T12:00:00Z"
  }
]
```
```
POST /notes/:id/replay
```
Description: Replay a note by ID.

Access: Private

Params:

id → Note identifier

Response Example:
```
{
  "message": "Replay triggered",
  "noteId": "note123"
}
```

## Notes Controller (`controllers/noteController.js`)

This file defines the main controller logic for managing **Notes** in the system.  
It handles creating, listing, replaying, and retrieving notes, with validation, logging, and queue integration.

---

### 1. Create Note (`createNote`)
Creates a new note and enqueues it for processing.  
- Validates input using **Zod** schema (`title`, `body`, `releaseAt`, `webhookUrl`).  
- Converts `releaseAt` to a Date object using **Day.js**.  
- Saves the note to MongoDB.  
- Pushes the note to the **queue service** for background delivery.  
- Logs note creation event.

**Request Example:**
```http
POST /notes
Content-Type: application/json
```
{
  "title": "Reminder",
  "body": "Meeting with team",
  "releaseAt": "2025-08-20T10:00:00Z",
  "webhookUrl": "https://example.com/webhook"
}
```
Response Example:

json
Copy
Edit
```
{
  "id": "64e8f9b1c29f5b1c3d2a9c01",
  "message": "Note created successfully"
}
```
2. List Notes (listNotes)
Fetches a paginated list of notes, optionally filtered by status.

Query params:

status → one of pending | delivered | failed | dead

page → page number (default: 1)

Returns note metadata (title, status, release time, delivery attempts).

Supports pagination with hasNext / hasPrev.

Request Example:

http
Copy
Edit
GET /notes?status=pending&page=1
Response Example:

json
Copy
Edit
```
{
  "notes": [
    {
      "id": "64e8f9b1c29f5b1c3d2a9c01",
      "title": "Reminder",
      "status": "pending",
      "releaseAt": "2025-08-20T10:00:00.000Z",
      "deliveredAt": null,
      "lastAttempt": null
    }
  ],
  "pagination": {
    "page": 1,
    "totalPages": 3,
    "total": 45,
    "hasNext": true,
    "hasPrev": false
  }
}
```
3. Replay Note (replayNote)
Re-enqueues a note for delivery if it failed previously.

Rejects replaying if the note is already delivered.

Resets status to pending and enqueues again.

Logs replay event.

Request Example:

http
Copy
Edit
POST /notes/:id/replay
Response Example:

json
Copy
Edit
```
{
  "message": "Note queued for replay",
  "id": "64e8f9b1c29f5b1c3d2a9c01",
  "status": "pending"
}
```
4. Get Note (getNote)
Fetches the full details of a note by its ID.

Request Example:

h
Copy
Edit
GET /notes/:id
Response Example:

json

```
{
  "id": "64e8f9b1c29f5b1c3d2a9c01",
  "title": "Reminder",
  "body": "Meeting with team",
  "status": "pending",
  "releaseAt": "2025-08-20T10:00:00.000Z",
  "webhookUrl": "https://example.com/webhook",
  "deliveredAt": null,
  "attempts": [],
  "createdAt": "2025-08-19T09:00:00.000Z",
  "updatedAt": "2025-08-19T09:00:00.000Z"
}
```
Dependencies Used
Zod → input validation

Day.js → date/time parsing

Mongoose (Note model) → MongoDB persistence

Logger (Pino) → structured logging

Queue Service → background note delivery

## Database Seeding (`seed.js`)

This script populates MongoDB with **sample notes** for testing and development.  
It clears existing notes and inserts a predefined set of example notes with different statuses.

---

### Sample Notes Inserted
1. **Welcome Message** → pending, scheduled 2 minutes in the future.  
2. **Daily Reminder** → pending, scheduled 1 hour in the future.  
3. **Already Delivered** → delivered yesterday, with a successful attempt logged.  
4. **Failed Delivery** → failed 2 hours ago, with an error attempt.  

---

### How to Run
From the project root, run:

```bash
```
node seed.js
```
or if using npm scripts:

bash
Copy
Edit
```
npm run seed
```
(You can add "seed": "node ./src/seed/seed.js" to your package.json scripts section.)

Environment Variables
The script uses the same MongoDB connection string as the API service.

Default:

bash
Copy
Edit
```
mongodb://localhost:27017/webhook_scheduler
``
Or override via:

bash
Copy
Edit
```
MONGODB_URI=mongodb://<host>:<port>/<dbname> node seed.js
```