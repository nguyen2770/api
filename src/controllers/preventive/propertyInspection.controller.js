const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const {
    schedulePreventiveService,
    preventiveService,
    sequenceService,
    propertyInspectionService,
    breakdownService,
} = require('../../services');
const ApiError = require('../../utils/ApiError');
const { schedulePreventiveTaskAssignUserStatus } = require('../../utils/constant');
/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */

const createPropertyInspection = catchAsync(async (req, res) => {
    const {
        checklistItems,
        assetMaintenance,
        checkboxBreakdown,
        breakdownDescription,
        priorityLevel,
        note,
        nameUser,
        listDocuments,
    } = req.body;
    const createdBy = req.user?.id || null;
    const create = await propertyInspectionService.createPropertyInspection(
        checklistItems,
        assetMaintenance,
        checkboxBreakdown,
        breakdownDescription,
        priorityLevel,
        note,
        nameUser,
        listDocuments,
        createdBy
    );
    res.status(httpStatus.CREATED).send({ code: 1, create });
});

const getPropertyInspections = catchAsync(async (req, res) => {
    const filter = pick(req.body, [
        'code',
        'status',
        'nameUser',
        'serial',
        'assetName',
        'assetModelName',
        'searchText',
        'assetNumber',
        'asset',
        'assetModel',
        'assetStyle',
        'category',
        'manufacturer',
    ]);
    const options = pick(req.body, ['sortBy', 'limit', 'page', 'sortOrder']);
    const { propertyInspections, totalResults } = await propertyInspectionService.queryPropertyInspections(filter, options, req);
    res.send({ code: 1, results: propertyInspections, ...totalResults });
});
const getPropertyInspectionById = catchAsync(async (req, res) => {
    const propertyInspection = await propertyInspectionService.getPropertyInspectionById(req.params.id);
    const propertyInspectionTasks = await propertyInspectionService.getPropertyInspectionTaskByPropertyInspection(
        propertyInspection._id
    );
    const assetMaintenanceAttachments = await propertyInspectionService.getAssetMaintenanceAttachmentByRes({
        propertyInspection: propertyInspection._id,
    });
    res.send({ code: 1, propertyInspection, propertyInspectionTasks, assetMaintenanceAttachments });
});
const cancelPropertyInspection = catchAsync(async (req, res) => {
    const propertyInspection = await propertyInspectionService.cancelPropertyInspection(req.body.id);
    res.send({ code: 1, propertyInspection });
});
const closePropertyInspection = catchAsync(async (req, res) => {
    const propertyInspection = await propertyInspectionService.closePropertyInspection(req.body.id);
    res.send({ code: 1, propertyInspection });
});
const updatePropertyInspectionById = catchAsync(async (req, res) => {
    const { propertyInspectionId, checklistItems, listDocuments, ...updateBody } = req.body;
    const propertyInspection = await propertyInspectionService.updatePropertyInspectionById(
        propertyInspectionId,
        updateBody,
        checklistItems,
        listDocuments
    );
    res.send({ code: 1, propertyInspection });
});
module.exports = {
    getPropertyInspections,
    createPropertyInspection,
    getPropertyInspectionById,
    cancelPropertyInspection,
    closePropertyInspection,
    updatePropertyInspectionById,
};
