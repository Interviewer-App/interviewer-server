# Use the official Node.js image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate the Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Copy the Prisma schema and migrations
COPY prisma ./prisma

# Expose the application port
EXPOSE 3333

# Run migrations and start the application
CMD npx prisma migrate deploy && npm start