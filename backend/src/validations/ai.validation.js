const { z } = require('zod');

const classifyNoteSchema = z.object({
  title: z.string().trim().optional(),
  content: z.string().trim().min(1, 'Nội dung ghi chú không được để trống'),
});

const assessTaskSchema = z.object({
  title: z.string().trim().min(1, 'Tiêu đề nhiệm vụ không được để trống'),
  description: z.string().trim().optional().nullable(),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Hạn chót (deadline) phải là định dạng ngày hợp lệ (ISO 8601)',
  }),
});

module.exports = {
  classifyNoteSchema,
  assessTaskSchema,
};
