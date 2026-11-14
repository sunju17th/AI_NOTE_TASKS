const { z } = require('zod');

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Tên danh mục không được để trống').max(255, 'Tên danh mục tối đa 255 ký tự'),
  description: z.string().trim().optional().nullable(),
});

module.exports = {
  categorySchema,
};
