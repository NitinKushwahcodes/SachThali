# Dockerfile for Sachthali LTS Express backend container deployment.
# Installs production node_modules, generates Prisma client, and exposes port 5000.
# Runs backend application entry point node src/index.js in production container.

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
