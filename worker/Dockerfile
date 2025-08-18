FROM node:20-alpine

WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy dependencies first
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source files
COPY src ./src

# Ensure proper permissions if the app writes files
RUN chown -R node:node /usr/src/app

# Use built-in non-root user
USER node

CMD ["npm", "run", "start"]
