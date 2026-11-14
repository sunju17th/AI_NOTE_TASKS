const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// 1. Tạo Pool kết nối PostgreSQL cục bộ
// Pool quản lý một tập hợp các kết nối mở sẵn đến Postgres,
// giúp tái sử dụng kết nối thay vì phải tạo mới mỗi khi có request, tăng hiệu năng đáng kể.
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

// 2. Khởi tạo Prisma Driver Adapter cho PostgreSQL (Chuẩn mới của Prisma 7)
const adapter = new PrismaPg(pool);

// 3. Khởi tạo PrismaClient sử dụng Driver Adapter
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

module.exports = { prisma, pool };
