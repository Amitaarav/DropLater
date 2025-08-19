FROM node:20-alpine

WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy dependencies first
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source files
COPY src ./src

EXPOSE 4000
CMD ["npm", "run", "start"]
