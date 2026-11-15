const { prisma } = require('../config/prisma');
const aiService = require('../services/ai.service');
const { classifyNoteSchema, assessTaskSchema } = require('../validations/ai.validation');

/**
 * Gợi ý danh mục cho một ghi chú (không lưu vào DB)
 * POST /ai/classify-note
 */
const classifyNote = async (req, res, next) => {
  try {
    const { title, content } = classifyNoteSchema.parse(req.body);

    const categories = await prisma.category.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    const suggestion = await aiService.classifyNote({
      title,
      content,
      categories,
    });

    return res.status(200).json(suggestion);
  } catch (error) {
    next(error);
  }
};

/**
 * Đánh giá mức độ ưu tiên của một nhiệm vụ (không lưu vào DB)
 * POST /ai/assess-task
 */
const assessTask = async (req, res, next) => {
  try {
    const { title, description, deadline } = assessTaskSchema.parse(req.body);

    const assessment = await aiService.assessTask({
      title,
      description,
      deadline,
    });

    return res.status(200).json(assessment);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  classifyNote,
  assessTask,
};
