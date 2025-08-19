# Worker Service

The **Worker** is responsible for processing scheduled notes.  
It polls MongoDB for due notes, pushes them into Redis queues (via BullMQ), and attempts delivery to the target webhook endpoints.  
All delivery attempts are logged in MongoDB for auditing and retries.

---

## Responsibilities
- Fetch notes that are **due** (`releaseAt <= now` and `status = pending`).  
- Enqueue notes into the Redis queue (`QUEUE_EVENTS`).  
- Deliver notes to their configured **webhookUrl**.  
- Update note status:
  - `delivered` → on success (HTTP 2xx).  
  - `failed` → on retryable error (HTTP 4xx/5xx).  
  - `dead` → if retries exhausted.  
- Record each delivery attempt (`statusCode`, `ok`, `error`) in the `attempts` array of the Note document.  

---

## Tech Stack
- **Node.js** with **BullMQ** → Job queues & retries.  
- **Redis** → Queue backend.  
- **MongoDB (Mongoose)** → Persistence of notes and attempts.  
- **Axios/Fetch** → HTTP delivery to webhooks.  
- **Day.js** → Time calculations.  
- **Pino** → Structured logging.  

---

## Worker Lifecycle
1. **Poll database** for notes due for delivery.  
2. **Push jobs** into Redis (`QUEUE_EVENTS`).  
3. **Process jobs** with retry & exponential backoff.  
4. **Update database** with attempt results.  
5. **Log events** (success, failure, retries, dead-letter).  

---

## Environment Variables
```bash
# Worker
WORKER_CONCURRENCY=5         # Number of concurrent jobs
RETRY_LIMIT=5                # Max retries before marking as dead
BACKOFF_DELAY=30000          # Delay (ms) for exponential backoff


MONGO_URL=mongodb://mongo:27017/app
REDIS_HOST=redis
REDIS_PORT=6379
QUEUE_EVENTS=events
Example Log Output

```
[info] Enqueued note 64e8f9b1c29f5b1c3d2a9c01 for delivery
[info] Attempting delivery → http://localhost:4000/sink
[error] Delivery failed { noteId: 64e8f9b1c29f5b1c3d2a9c01, statusCode: 500 }
[info] Note marked as failed after 3 attempts
[info] Note delivered successfully { noteId: 64e8f9b1c29f5b1c3d2a9c02 }
``
## Worker Folder Structure

```
worker/
│── src/
│   ├── config/              # Configuration files
│   │   ├── database.js      # MongoDB connection
│   │   └── redis.js         # Redis connection
│   │
│   ├── models/              # Database models
│   │   └── Note.js          # Note schema (status, attempts, releaseAt, etc.)
│   │
│   ├── services/            # Core services
│   │   ├── deliveryService.js   # Handles webhook delivery + retries
│   │   └── pollingService.js    # Polls DB for due notes and enqueues them
│   │
│   ├── utils/               # Utility functions
│   │   ├── worker.js        # Worker bootstrap
│   │   └── logger.js        # Centralized logger
│   │
│   └── index.js (entry)     # Starts worker + poller
│
├── .env.example             # Example environment variables
├── Dockerfile               # Container build file
├── package.json             # Dependencies & scripts
└── README.md                # Project guide

 ```