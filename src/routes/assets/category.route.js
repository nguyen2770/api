const express = require('express');
const { categoryController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createCategory'), categoryController.createCategory);
router.get('/get-list', categoryController.getCategorys);
router.get('/get-by-id', categoryController.getCategoryById);
router.patch('/update', auth('updateCategory'), categoryController.updateCategory);
router.patch('/update-status', auth('updateStatus'), categoryController.updateStatus);
router.delete('/delete', auth('deleteCategory'), categoryController.deleteCategory);
router.get('/get-all', categoryController.getAllCategory);
module.exports = router;
