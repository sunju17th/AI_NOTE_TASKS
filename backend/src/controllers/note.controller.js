const { prisma } = require('../config/prisma');
const AppError = require('../utils/appError');
const { createNoteSchema, updateNoteSchema, queryNoteSchema } = require('../validations/note.validation');

/**
 * Lấy danh sách ghi chú có tìm kiếm, lọc danh mục và phân trang
 * GET /notes
 */
const getNotes = async (req, res, next) => {
  try {
    const { category_id, q, page, limit } = queryNoteSchema.parse(req.query);

    // Xây dựng điều kiện lọc (luôn gắn với userId)
    const where = {
      userId: req.user.id,
    };

    // Lọc theo danh mục: 'none' -> chưa phân loại (null), hoặc uuid cụ thể
    if (category_id === 'none') {
      where.categoryId = null;
    } else if (category_id) {
      where.categoryId = category_id;
    }

    // Tìm kiếm không phân biệt hoa thường trong title và content
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Tính toán phân trang
    const skip = (page - 1) * limit;

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: { id: true, name: true },
          },
          aiCategory: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.note.count({ where }),
    ]);

    return res.status(200).json({
      data: notes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Xem chi tiết một ghi chú
 * GET /notes/:id
 */
const getNoteById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Đảm bảo chỉ xem được note của chính mình (nếu của người khác trả về 404 theo PRD 4.1)
    const note = await prisma.note.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
        aiCategory: {
          select: { id: true, name: true },
        },
      },
    });

    if (!note) {
      throw new AppError('Không tìm thấy ghi chú', 404, 'NOT_FOUND');
    }

    return res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

/**
 * Lưu ghi chú mới
 * POST /notes
 */
const createNote = async (req, res, next) => {
  try {
    const { title, content, category_id, ai_category_id } = createNoteSchema.parse(req.body);

    // Kiểm tra tính hợp lệ của category_id (phải thuộc về user này)
    if (category_id) {
      const cat = await prisma.category.findFirst({
        where: { id: category_id, userId: req.user.id },
      });
      if (!cat) {
        throw new AppError('Danh mục được chọn không tồn tại', 404, 'NOT_FOUND');
      }
    }

    // Kiểm tra tính hợp lệ của ai_category_id nếu có
    if (ai_category_id) {
      const aiCat = await prisma.category.findFirst({
        where: { id: ai_category_id, userId: req.user.id },
      });
      if (!aiCat) {
        throw new AppError('Danh mục gợi ý không tồn tại', 404, 'NOT_FOUND');
      }
    }

    // Tạo ghi chú mới
    const newNote = await prisma.note.create({
      data: {
        userId: req.user.id,
        title: title || null,
        content,
        categoryId: category_id || null,
        aiCategoryId: ai_category_id || null,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
        aiCategory: {
          select: { id: true, name: true },
        },
      },
    });

    return res.status(201).json(newNote);
  } catch (error) {
    next(error);
  }
};

/**
 * Chỉnh sửa ghi chú
 * PUT /notes/:id
 * Lưu ý: Theo PRD 4.4, khi PUT không cho phép sửa ai_category_id
 */
const updateNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, category_id } = updateNoteSchema.parse(req.body);

    // 1. Kiểm tra quyền sở hữu ghi chú
    const existingNote = await prisma.note.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingNote) {
      throw new AppError('Không tìm thấy ghi chú', 404, 'NOT_FOUND');
    }

    // 2. Nếu có thay đổi danh mục, kiểm tra danh mục mới có thuộc về user không
    if (category_id !== undefined && category_id !== null) {
      const cat = await prisma.category.findFirst({
        where: { id: category_id, userId: req.user.id },
      });
      if (!cat) {
        throw new AppError('Danh mục được chọn không tồn tại', 404, 'NOT_FOUND');
      }
    }

    // 3. Tiến hành cập nhật (không đụng tới aiCategoryId)
    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingNote.title,
        content: content !== undefined ? content : existingNote.content,
        categoryId: category_id !== undefined ? category_id : existingNote.categoryId,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
        aiCategory: {
          select: { id: true, name: true },
        },
      },
    });

    return res.status(200).json(updatedNote);
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa ghi chú
 * DELETE /notes/:id
 */
const deleteNote = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Kiểm tra quyền sở hữu
    const existing = await prisma.note.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existing) {
      throw new AppError('Không tìm thấy ghi chú', 404, 'NOT_FOUND');
    }

    await prisma.note.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
};
