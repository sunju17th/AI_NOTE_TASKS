const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/auth.routes');
const categoryRoutes = require('./routes/category.routes');
const noteRoutes = require('./routes/note.routes');
const taskRoutes = require('./routes/task.routes');
const aiRoutes = require('./routes/ai.routes');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/appError');

const app = express();

// 1. Bảo mật HTTP headers với Helmet
app.use(helmet());

// 2. Cấu hình CORS
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin }));

// 3. Parse JSON Body
app.use(express.json());

// 4. Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 5. Đăng ký các Route chính
app.use('/auth', authRoutes);
app.use('/categories', categoryRoutes);
app.use('/notes', noteRoutes);
app.use('/tasks', taskRoutes);
app.use('/ai', aiRoutes);

// 6. Xử lý Route không tồn tại (404)
app.use((req, res, next) => {
  next(new AppError(`Đường dẫn ${req.originalUrl} không tồn tại`, 404, 'ROUTE_NOT_FOUND'));
});

// 7. Global Error Handler (bắt buộc đặt ở cuối cùng)
app.use(errorHandler);

module.exports = app;
