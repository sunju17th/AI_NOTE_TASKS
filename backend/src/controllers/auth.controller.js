const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/prisma');
const AppError = require('../utils/appError');
const { registerSchema, loginSchema } = require('../validations/auth.validation');

/**
 * Controller xử lý Đăng ký tài khoản
 * POST /auth/register
 */
const register = async (req, res, next) => {
  try {
    // 1. Kiểm tra tính hợp lệ của dữ liệu đầu vào với Zod
    const { email, password, name } = registerSchema.parse(req.body);

    // 2. Kiểm tra xem email đã tồn tại hay chưa
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('Email này đã được đăng ký trong hệ thống', 409, 'CONFLICT');
    }

    // 3. Băm mật khẩu với bcrypt (Salt rounds = 10)
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Tạo User mới trong PostgreSQL qua Prisma
    // Lưu ý: Dùng select để loại trừ passwordHash, không bao giờ để lộ ra ngoài!
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    return res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller xử lý Đăng nhập
 * POST /auth/login
 */
const login = async (req, res, next) => {
  try {
    // 1. Validate dữ liệu
    const { email, password } = loginSchema.parse(req.body);

    // 2. Tìm user theo email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 3. Dùng chung một thông báo lỗi nếu sai email hoặc sai password
    // Mục đích: Bảo mật, không để hacker dò quét xem email nào đã tồn tại trong hệ thống!
    const invalidAuthError = new AppError('Email hoặc mật khẩu không chính xác', 401, 'INVALID_CREDENTIALS');

    if (!user) {
      throw invalidAuthError;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw invalidAuthError;
    }

    // 4. Tạo JWT Token (thời hạn 7 ngày)
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller lấy thông tin User hiện tại
 * GET /auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('Người dùng không tồn tại', 404, 'NOT_FOUND');
    }

    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
