const express = require('express');
const { preventiveOfModelController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.post('/create', auth('createPreventiveOfModel'), preventiveOfModelController.createPreventiveOfModel);
router.patch(
    '/get-list',
    auth('getPrevenqueryPreventiveOfModelstives'),
    preventiveOfModelController.queryPreventiveOfModels
);
router.get('/get-by-id', auth('getPreventiveOfModelById'), preventiveOfModelController.getPreventiveOfModelById);
router.patch('/update', auth('updatePreventiveOfModelById'), preventiveOfModelController.updatePreventiveOfModelById);
router.delete('/delete', auth('deletePreventiveOfModelById'), preventiveOfModelController.deletePreventiveOfModelById);
router.get('/get-count-preventive-by-prevetive-of-model', preventiveOfModelController.getTotalPreventiveByPreventiveOfModel);
// router.get('/get-re-assign-user-by-preventive', preventiveController.getResAssignUserByPreventive);
// router.patch('/stop-preventive', auth("stopPreventive"), preventiveController.stopPreventive);
router.patch(
    '/start-preventive-of-model',
    auth('startPreventiveByPreventiveOfModel'),
    preventiveOfModelController.startPreventiveByPreventiveOfModel
);
router.patch(
    '/start-many-preventive-of-model',
    auth('startPreventiveByPreventiveOfModel'),
    preventiveOfModelController.startManyPreventiveByPreventiveOfModel
);
router.patch(
    '/stop-preventive-of-model',
    auth('stopPreventiveByPreventiveOfModel'),
    preventiveOfModelController.stopPreventiveByPreventiveOfModel
);
// router.patch('/comfirm-reassignuser', auth("comfirmReAssignUser"), preventiveController.comfirmReAssignUser);
// router.post('/create-preventive-comment', auth("createPreventiveComment"), preventiveController.createPreventiveComment);
// router.get('/get-preventive-comment', preventiveController.getPreventiveComments);

module.exports = router;
