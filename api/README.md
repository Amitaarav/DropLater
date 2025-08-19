#API Service

This folder contains the API service for the project.
It provides REST endpoints for clients and communicates with other services (worker, sink, and admin) via queues and databases.

## Tech Stack

Node.js with Express

MongoDB (for persistence)

Redis (for caching & queues)

BullMQ (for job queues)

Zod (for validation)

Pino (for logging)

Docker (for containerization)

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

\### Indexing Strategy (Database)

releaseAt (ascending) → Worker can quickly find due notes to enqueue.

status → Admin UI can list/filter notes efficiently.

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
import { generateIdempotencyKey } from './idempotency.js';

const key = generateIdempotencyKey('note123', '2025-08-19T10:00:00Z');
console.log(key);
// => "a3c5f4d2e1..."
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