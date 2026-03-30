const express = require('express');
const { contractTypeController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createContractType'), contractTypeController.createContractType);
router.get('/get-list', contractTypeController.getContractTypes);
router.get('/get-by-id', contractTypeController.getContractTypeById);
router.patch('/update', auth('updateContractType'), contractTypeController.updateContractType);
router.delete('/delete', auth('deleteContractType'), contractTypeController.deleteContractType);
router.get('/get-all', contractTypeController.getAllContractType);
module.exports = router;
