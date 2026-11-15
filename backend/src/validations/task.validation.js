const { z } = require('zod');

const priorityEnum = z.enum(['not_urgent', 'urgent', 'critical'], {
  errorMap: () => ({ message: "Priority phải là một trong các giá trị: 'not_urgent', 'urgent', 'critical'" }),
});

const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Tiêu đề nhiệm vụ không được để trống').max(255, 'Tiêu đề tối đa 255 ký tự'),
  description: z.string().trim().optional().nullable(),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Hạn chót (deadline) phải là định dạng ngày hợp lệ (ISO 8601)',
  }),
  priority: priorityEnum,
  ai_priority: priorityEnum.optional().nullable(),
});

const updateTaskSchema = z.object({
  title: z.string().trim().min(1, 'Tiêu đề nhiệm vụ không được để trống').max(255, 'Tiêu đề tối đa 255 ký tự').optional(),
  description: z.string().trim().optional().nullable(),
  deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Hạn chót (deadline) phải là định dạng ngày hợp lệ (ISO 8601)',
  }).optional(),
  priority: priorityEnum.optional(),
  ai_priority: priorityEnum.optional().nullable(),
});

const queryTaskSchema = z.object({
  priority: priorityEnum.optional(),
  sort: z.enum(['deadline', '-deadline']).default('deadline'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50, 'Giới hạn tối đa là 50').default(20),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  queryTaskSchema,
};
