const express = require('express');
const { schedulePreventiveDocumentsController } = require('../../../controllers');
const auth = require('../../../middlewares/auth');

const router = express.Router();

router.patch(
    '/get-schedule-preventive-documents-by-schedule-preventive',
    auth('getSchedulePreventiveDocumentBySchedulePreventive'),
    schedulePreventiveDocumentsController.getSchedulePreventiveDocumentBySchedulePreventive
);
router.delete(
    '/delete-schedule-preventive-documents-by-id/:id',
    auth('deleteSchedulePreventiveDocumentById'),
    schedulePreventiveDocumentsController.deleteSchedulePreventiveDocumentById
);
router.post(
    '/create-schedule-preventive-document',
    auth('createSchedulePreventiveDocument'),
    schedulePreventiveDocumentsController.createSchedulePreventiveDocument
);
module.exports = router;
