const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { buildingService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */

const createBuilding = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        // createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    const Building = await buildingService.createBuilding(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, Building });
});
const getBuildings = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['buildingName']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await buildingService.queryBuildings(filter, options);
    // exchangeRequests.abc = 123;
    res.send({ results: result, code: 1 });
});

const getBuildingById = catchAsync(async (req, res) => {
    const Building = await buildingService.getBuildingById(req.query.id);
    if (!Building) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Building not found');
    }
    res.send({ Building, code: 1 });
});

/**
 * Update user by id.
 * @type {(function(*, *, *): void)|*}
 */
const updateBuilding = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.Building;
    // updateData.updatedBy = req.user.id; // Nếu cần
    const updated = await buildingService.updateBuildingById(id, updateData);
    res.send({ code: 1, data: updated });
});

/**
 * Delete user by id.
 * @type {(function(*, *, *): void)|*}
 */
const deleteBuilding = catchAsync(async (req, res) => {
    await buildingService.deleteBuildingById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});

const updateStatus = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.Building;
    const updated = await buildingService.updateStatus(id, updateData);
    res.send({ code: 1, data: updated });
});

const getAllBuilding = catchAsync(async (req, res) => {
    const Buildings = await buildingService.getAllBuilding();
    res.send({ code: 1, data: Buildings });
});

const uploadBuildingExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.send({ code: 0, message: 'Not file' });
        }
        const result = await buildingService.uploadBuildingExcel(req.file.path, req.file);
        return res.send({ code: 1, result });
    } catch (error) {
        return res.send({ code: 0, message: error.message || 'Tải file lên không thành công' });
    }
};

module.exports = {
    createBuilding,
    getBuildings,
    getBuildingById,
    updateBuilding,
    deleteBuilding,
    updateStatus,
    getAllBuilding,
    uploadBuildingExcel,
};
