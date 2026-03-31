const express = require('express');
const { complianceTypeController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createComplianceType'), complianceTypeController.createComplianceType);
router.get('/get-list', complianceTypeController.getComplianceTypes);
router.get('/get-by-id', complianceTypeController.getComplianceTypeById);
router.patch('/update', auth('updateComplianceType'), complianceTypeController.updateComplianceType);
router.delete('/delete', auth('deleteComplianceType'), complianceTypeController.deleteComplianceType);
router.get('/get-all', complianceTypeController.getAllComplianceType);

module.exports = router;
