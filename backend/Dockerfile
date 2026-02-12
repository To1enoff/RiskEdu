FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig*.json nest-cli.json ./
COPY src ./src

RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
