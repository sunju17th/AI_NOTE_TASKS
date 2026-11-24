# ==============================================================================
# GIAI ĐOẠN 1: Build Frontend (Node.js 20 Alpine)
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ mã nguồn
COPY . .

# Tiếp nhận biến VITE_API_URL khi build (mặc định trỏ về backend port 3000)
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

# Build ứng dụng Vite ra thư mục dist
RUN npm run build

# ==============================================================================
# GIAI ĐOẠN 2: Serve bằng Nginx Web Server (Nginx Alpine siêu nhẹ ~20MB)
# ==============================================================================
FROM nginx:alpine

# Copy cấu hình Nginx tối ưu cho SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy kết quả build từ giai đoạn 1 sang thư mục web của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Mở cổng HTTP tiêu chuẩn bên trong container
EXPOSE 80

# Khởi chạy Nginx
CMD ["nginx", "-g", "daemon off;"]
