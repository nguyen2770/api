const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { originService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createOrigin = catchAsync(async (req, res) => {

    req.body = {
        ...req.body,
        // createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    const Origin = await originService.createOrigin(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, Origin });
});

const getOriginById = catchAsync(async (req, res) => {
    const Origin = await originService.getOriginById(req.query.id);
    if (!Origin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Origin not found');
    }
    res.send({code: 1, Origin});
});


const getAllOrigin = catchAsync(async (req, res) => {
    const Origins = await originService.getAllOrigin();
    res.send({ code: 1, data: Origins });
});

module.exports = {
    createOrigin,
    getOriginById,
    getAllOrigin,
}
