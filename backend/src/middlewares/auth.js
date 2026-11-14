const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');

/**
 * Middleware xác thực token JWT
 * Kiểm tra header Authorization, giải mã và gắn thông tin user vào req.user
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AppError('Yêu cầu cung cấp token xác thực', 401, 'UNAUTHORIZED');
    }

    // Hỗ trợ cả định dạng "Bearer <token>" lẫn "<token>"
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

    if (!token) {
      throw new AppError('Token xác thực không hợp lệ', 401, 'UNAUTHORIZED');
    }

    // Giải mã và kiểm tra tính hợp lệ của token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Lưu thông tin user đã xác thực vào request để các controller tiếp theo sử dụng
    req.user = {
      id: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;
