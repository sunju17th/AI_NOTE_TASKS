require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy thành công tại http://localhost:${PORT}`);
  console.log(`⚙️  Môi trường: ${process.env.NODE_ENV || 'development'}`);
});

// Xử lý unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Đang tắt server...', err);
  server.close(() => {
    process.exit(1);
  });
});
