const { ZodError } = require('zod');
const { Prisma } = require('@prisma/client');
const AppError = require('../utils/appError');

/**
 * Middleware xử lý lỗi tập trung (Global Error Handler)
 * Định dạng thống nhất theo chuẩn PRD 4.1:
 * {
 *   "error": {
 *     "code": "...",
 *     "message": "...",
 *     "details": [...]
 *   }
 * }
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Đã có lỗi hệ thống xảy ra';
  let details = err.details || null;

  // 1. Xử lý lỗi validate dữ liệu từ Zod
  if (err instanceof ZodError || err.name === 'ZodError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Dữ liệu không hợp lệ';
    const issues = err.issues || err.errors || [];
    details = issues.map((e) => ({
      field: e.path ? e.path.join('.') : '',
      message: e.message,
    }));
  }

  // 2. Xử lý mã lỗi từ Prisma ORM
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Vi phạm ràng buộc Unique (trùng email, trùng [userId, name])
    if (err.code === 'P2002') {
      statusCode = 409;
      code = 'CONFLICT';
      const target = err.meta?.target ? err.meta.target.join(', ') : 'dữ liệu';
      message = `Giá trị của ${target} đã tồn tại trong hệ thống`;
    }
    // P2025: Bản ghi cần cập nhật/xóa không tìm thấy
    else if (err.code === 'P2025') {
      statusCode = 404;
      code = 'NOT_FOUND';
      message = 'Không tìm thấy tài nguyên yêu cầu';
    } else {
      statusCode = 400;
      code = `PRISMA_${err.code}`;
      message = 'Lỗi thao tác cơ sở dữ liệu';
    }
  }

  // 3. Xử lý lỗi JWT (chưa đăng nhập / token hết hạn)
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = err.name === 'TokenExpiredError' ? 'Phiên đăng nhập đã hết hạn' : 'Token xác thực không hợp lệ';
  }

  // 4. Nếu là lỗi chưa lường trước trong quá trình dev -> log ra console
  if (statusCode === 500) {
    console.error('🔥 [UNHANDLED ERROR]:', err);
  }

  const responseBody = {
    error: {
      code,
      message,
    },
  };

  if (details && details.length > 0) {
    responseBody.error.details = details;
  }

  return res.status(statusCode).json(responseBody);
};

module.exports = errorHandler;
