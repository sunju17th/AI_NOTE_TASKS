const express = require('express');
const router = express.Router();
const noteController = require('../controllers/note.controller');
const authenticate = require('../middlewares/auth');

// Mọi route về Note đều yêu cầu xác thực
router.use(authenticate);

router.get('/', noteController.getNotes);
router.get('/:id', noteController.getNoteById);
router.post('/', noteController.createNote);
router.put('/:id', noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

module.exports = router;
