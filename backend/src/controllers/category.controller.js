const { prisma } = require('../config/prisma');
const AppError = require('../utils/appError');
const { categorySchema } = require('../validations/category.validation');

/**
 * Lấy danh sách danh mục của user hiện tại
 * GET /categories
 */
const getCategories = async (req, res, next) => {
  try {
    // Luôn luôn lọc theo userId từ token
    const categories = await prisma.category.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });

    return res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

/**
 * Tạo danh mục mới
 * POST /categories
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, description } = categorySchema.parse(req.body);

    // Kiểm tra trùng tên danh mục trong phạm vi user này
    const existing = await prisma.category.findUnique({
      where: {
        userId_name: {
          userId: req.user.id,
          name,
        },
      },
    });

    if (existing) {
      throw new AppError('Danh mục với tên này đã tồn tại', 409, 'CONFLICT');
    }

    const category = await prisma.category.create({
      data: {
        userId: req.user.id,
        name,
        description: description || null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });

    return res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

/**
 * Sửa tên hoặc chú thích danh mục
 * PUT /categories/:id
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = categorySchema.parse(req.body);

    // 1. Kiểm tra danh mục có tồn tại và thuộc về user này hay không
    // Theo PRD 4.1: Nếu tài nguyên của người khác, trả 404 (không trả 403)
    const existing = await prisma.category.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existing) {
      throw new AppError('Không tìm thấy danh mục', 404, 'NOT_FOUND');
    }

    // 2. Nếu đổi sang tên mới, kiểm tra xem tên mới có bị trùng với danh mục khác của user không
    if (name !== existing.name) {
      const duplicate = await prisma.category.findUnique({
        where: {
          userId_name: {
            userId: req.user.id,
            name,
          },
        },
      });

      if (duplicate) {
        throw new AppError('Tên danh mục này đã được sử dụng', 409, 'CONFLICT');
      }
    }

    // 3. Tiến hành cập nhật
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name,
        description: description !== undefined ? description : existing.description,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });

    return res.status(200).json(updatedCategory);
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa danh mục
 * DELETE /categories/:id
 * Lưu ý: Khi xóa, các note thuộc danh mục này sẽ tự động chuyển về category_id = NULL
 * (nhờ vào ràng buộc ON DELETE SET NULL trong PostgreSQL)
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Kiểm tra quyền sở hữu
    const existing = await prisma.category.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existing) {
      throw new AppError('Không tìm thấy danh mục', 404, 'NOT_FOUND');
    }

    // Xóa danh mục
    await prisma.category.delete({
      where: { id },
    });

    // Trả về 204 No Content
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
