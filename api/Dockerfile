FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json ./

RUN npm ci --omit=dev

COPY src ./src

COPY public ./public

EXPOSE 3000

CMD ["npm","run","start"]
