### Project Setup Guide
1. Initialize the Project

The first step is to create a new Node.js project with a default package.json file.
```
npm init -y
```

npm init initializes a new Node.js project.

The -y flag automatically accepts all default options (so you don’t need to answer prompts).

This generates a package.json file where all dependencies and scripts will be managed.

2. Install Development Dependencies (Linting & Formatting)

Next, install tools to maintain clean, consistent, and error-free code.
```
npm install --save-dev eslint eslint-config-prettier prettier

```
--save-dev → Marks these as development dependencies (they won’t be bundled in production).

eslint → A linter that helps find and fix coding errors.

prettier → A code formatter that ensures consistent code style.

eslint-config-prettier → Disables ESLint rules that might conflict with Prettier, so both tools work smoothly together.

This setup ensures that your codebase stays readable and standardized.

3. Install Core Dependencies (Databases)

Now install the libraries required for database support.
```
npm install --save mongodb redis
```

--save (default in newer npm versions) → Marks these as production dependencies.

mongodb → Official MongoDB driver for Node.js, used to interact with MongoDB databases.

redis → Official Redis client for Node.js, used for caching, session management, and fast data retrieval.

## After these steps, your project is initialized with:

A package.json file.

Development tools (ESLint + Prettier).

Database libraries (MongoDB + Redis)

## Why these indexes?

releaseAt (asc) → Worker can quickly find due notes to enqueue if needed.

status → Admin UI can list/filter notes by state efficiently. 