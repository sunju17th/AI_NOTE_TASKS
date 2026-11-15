const { prisma } = require('../config/prisma');
const AppError = require('../utils/appError');
const { createTaskSchema, updateTaskSchema, queryTaskSchema } = require('../validations/task.validation');

/**
 * Lấy danh sách nhiệm vụ có lọc theo priority, sắp xếp deadline và phân trang
 * GET /tasks
 */
const getTasks = async (req, res, next) => {
  try {
    const { priority, sort, page, limit } = queryTaskSchema.parse(req.query);

    // 1. Xây dựng điều kiện lọc
    const where = {
      userId: req.user.id,
    };

    if (priority) {
      where.priority = priority;
    }

    // 2. Sắp xếp theo deadline
    // 'deadline' -> tăng dần (asc, việc gần nhất xếp đầu)
    // '-deadline' -> giảm dần (desc)
    const orderBy = {
      deadline: sort === '-deadline' ? 'desc' : 'asc',
    };

    // 3. Phân trang
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.task.count({ where }),
    ]);

    return res.status(200).json({
      data: tasks,
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
 * Xem chi tiết nhiệm vụ
 * GET /tasks/:id
 */
const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!task) {
      throw new AppError('Không tìm thấy nhiệm vụ', 404, 'NOT_FOUND');
    }

    return res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

/**
 * Lưu nhiệm vụ mới
 * POST /tasks
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, deadline, priority, ai_priority } = createTaskSchema.parse(req.body);

    const newTask = await prisma.task.create({
      data: {
        userId: req.user.id,
        title,
        description: description || null,
        deadline: new Date(deadline),
        priority,
        aiPriority: ai_priority || null,
      },
    });

    return res.status(201).json(newTask);
  } catch (error) {
    next(error);
  }
};

/**
 * Chỉnh sửa nhiệm vụ
 * PUT /tasks/:id
 */
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, deadline, priority, ai_priority } = updateTaskSchema.parse(req.body);

    // Kiểm tra quyền sở hữu
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingTask) {
      throw new AppError('Không tìm thấy nhiệm vụ', 404, 'NOT_FOUND');
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingTask.title,
        description: description !== undefined ? description : existingTask.description,
        deadline: deadline !== undefined ? new Date(deadline) : existingTask.deadline,
        priority: priority !== undefined ? priority : existingTask.priority,
        aiPriority: ai_priority !== undefined ? ai_priority : existingTask.aiPriority,
      },
    });

    return res.status(200).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa nhiệm vụ
 * DELETE /tasks/:id
 */
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingTask) {
      throw new AppError('Không tìm thấy nhiệm vụ', 404, 'NOT_FOUND');
    }

    await prisma.task.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
