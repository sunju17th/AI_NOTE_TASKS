# ==============================================================================
# Dockerfile cho Backend Service (Node.js 20 Alpine)
# ==============================================================================
FROM node:20-alpine

# Cài đặt OpenSSL (cần thiết cho Prisma Client trên Alpine)
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Cài đặt toàn bộ dependencies (bao gồm prisma devDependency để sinh client và chạy migration)
RUN npm install

# Copy cấu hình Prisma và lược đồ Database
COPY prisma ./prisma/
COPY prisma7.config.ts ./

# Tạo Prisma Client
RUN npx prisma generate

# Copy toàn bộ mã nguồn ứng dụng
COPY src ./src/

# Mở cổng dịch vụ
EXPOSE 3000

# Khởi chạy: Tự động chạy migration schema vào Database, nạp dữ liệu mẫu rồi khởi động Server
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node src/server.js"]
