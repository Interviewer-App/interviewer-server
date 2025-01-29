# Build stage
FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

ENV DATABASE_URL=postgresql://coullax:npg_QtjwuSHzx0d8@ep-lively-band-a2hohwse.eu-central-1.pg.koyeb.app/koyebdb?sslmode=require&pgbouncer=true&connect_timeout=10&schema=public


RUN npm install prisma --save-dev
RUN npx prisma generate
RUN npx prisma migrate deploy
RUN npm run build

# Final stage
FROM node:20-alpine

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY package.json ./

ENV NODE_ENV=production

EXPOSE 3333

CMD ["node", "dist/main.js"]