# Created by Metrum AI for Dell
FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json ./

RUN pnpm install
COPY . ./

EXPOSE 5173
RUN pnpm run build
ENTRYPOINT pnpm run serve
