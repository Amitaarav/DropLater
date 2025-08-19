FROM node:18-alpine as builder

WORKDIR /app
COPY admin/package*.json ./
RUN npm install
COPY admin/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY admin/nginx.conf /etc/nginx/nginx.conf
EXPOSE 3002
CMD ["nginx", "-g", "daemon off;"]