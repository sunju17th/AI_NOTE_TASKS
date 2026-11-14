const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().trim().email('Email không đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  name: z.string().trim().min(1, 'Tên không được để trống').optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email('Email không đúng định dạng'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

module.exports = {
  registerSchema,
  loginSchema,
};
