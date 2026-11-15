const { z } = require('zod');

// Helper: Cho phép truyền uuid, null, undefined, hoặc chuỗi rỗng "" (tự động chuyển thành null)
const optionalUuidOrNull = z.preprocess(
  (val) => (val === '' || val === undefined ? null : val),
  z.string().uuid('ID danh mục không hợp lệ').nullable().optional()
);

const createNoteSchema = z.object({
  title: z.string().trim().max(255, 'Tiêu đề tối đa 255 ký tự').optional().nullable(),
  content: z.string().trim().min(1, 'Nội dung ghi chú không được để trống'),
  category_id: optionalUuidOrNull,
  ai_category_id: optionalUuidOrNull,
});

const updateNoteSchema = z.object({
  title: z.string().trim().max(255, 'Tiêu đề tối đa 255 ký tự').optional().nullable(),
  content: z.string().trim().min(1, 'Nội dung ghi chú không được để trống').optional(),
  category_id: optionalUuidOrNull,
  // Khi PUT, không cho phép sửa ai_category_id theo yêu cầu PRD 4.4
});

const queryNoteSchema = z.object({
  category_id: z.string().optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50, 'Giới hạn tối đa là 50').default(20),
});

module.exports = {
  createNoteSchema,
  updateNoteSchema,
  queryNoteSchema,
};
