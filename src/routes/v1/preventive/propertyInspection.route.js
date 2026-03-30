const express = require('express');
const { propertyInspectionController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.patch('/get-list', auth('getPropertyInspections'), propertyInspectionController.getPropertyInspections);
router.post('/create', auth('createPropertyInspection'), propertyInspectionController.createPropertyInspection);
router.get('/get-by-id/:id', auth('getPropertyInspectionById'), propertyInspectionController.getPropertyInspectionById);
router.patch(
    '/close-property-inspection',
    auth('closePropertyInspection'),
    propertyInspectionController.closePropertyInspection
);
router.patch(
    '/cancel-property-inspection',
    auth('cancelPropertyInspection'),
    propertyInspectionController.cancelPropertyInspection
);
router.patch('/update', auth('updatePropertyInspectionById'), propertyInspectionController.updatePropertyInspectionById);
module.exports = router;
