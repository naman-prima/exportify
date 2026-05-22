FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/ .
RUN npm run build

RUN npm prune --production

EXPOSE 4000

CMD ["node", "dist/main.js"]
