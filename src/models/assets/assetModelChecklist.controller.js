const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { assetModelChecklistService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createAssetModelChecklist = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    await assetModelChecklistService.createAssetModelChecklist(req.body);
    res.status(httpStatus.CREATED).send({ code: 1 });
});
const updateAssetModelChecklist = catchAsync(async (req, res) => {
    const checklists = req.body.checklists;
    const checkReset = req.body.checkReset;
    await assetModelChecklistService.updateAssetModelChecklist(req.params.assetModelId, checklists, checkReset);
    res.status(httpStatus.OK).send({ code: 1 });
});

const getAssetModelChecklistByRes = catchAsync(async (req, res) => {
    const checklists = await assetModelChecklistService.getAssetModelChecklistByRes(req.body);
    res.status(httpStatus.OK).send({ code: 1, data: checklists });
});

module.exports = {
    createAssetModelChecklist,
    updateAssetModelChecklist,
    getAssetModelChecklistByRes,
};
