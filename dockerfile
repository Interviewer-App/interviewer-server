# Build stage
FROM node:16-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm install prisma --save-dev
RUN npx prisma generate
RUN npm run build

# Final stage
FROM node:16-alpine

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY package*.json ./

ENV NODE_ENV=production

EXPOSE 3333

CMD ["node", "dist/main.js"]