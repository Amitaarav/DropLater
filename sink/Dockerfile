FROM node:20-alpine

WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy dependencies first
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source files
COPY src ./src

# It ensures proper permissions
RUN chown -R node:node /usr/src/app

# Using the built-in non-root user
USER node

EXPOSE 4000
CMD ["npm", "run", "start"]
