const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const authenticate = require('../middlewares/auth');

// Mọi route về category đều yêu cầu người dùng phải đăng nhập
router.use(authenticate);

router.get('/', categoryController.getCategories);
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
