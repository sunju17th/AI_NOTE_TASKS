const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const authenticate = require('../middlewares/auth');

// Yêu cầu xác thực tài khoản
router.use(authenticate);

router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
