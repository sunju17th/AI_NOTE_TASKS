FROM node:22-alpine

WORKDIR /app

# Copy dependencies manifest
COPY package*.json ./

# Install dependencies (including Prisma CLI for migrations)
RUN npm install

# Copy source code and schema
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Make entrypoint executable
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
