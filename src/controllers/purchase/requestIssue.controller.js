const httpStatus = require('http-status');
const mongoose = require('mongoose');
const pick = require('../../utils/pick');
const catchAsync = require('../../utils/catchAsync');
const { requestIssueService } = require('../../services');
const ApiError = require('../../utils/ApiError');

/**
 * Create a receipt purchase
 */
const createRequestIssue = catchAsync(async (req, res) => {
    const RequestIssue = await requestIssueService.createRequestIssue(req.body,  req.user._id);
    res.status(httpStatus.CREATED).send({ code: 1, RequestIssue });
});

const getRequestIssues = catchAsync(async (req, res) => {
        const { code, branch, department, startDate, endDate, action } = req.query;
         const filter = {};
     
         if (code && code.trim()) {
             filter.code = { $regex: code, $options: 'i' };
         }

        if (action && action.trim()) {
            filter.action = { $regex: action, $options: 'i' };
        }
    
     
         if (branch && branch.trim()) {
             filter.branch = new mongoose.Types.ObjectId(branch);
         }
     
         if (department && department.trim()) {
             filter.department = new mongoose.Types.ObjectId(department);
         }
     
         if (startDate && startDate.trim()) {
             filter.createdAt = filter.createdAt || {};
             filter.createdAt.$gte = new Date(startDate);
         }
     
         if (endDate && endDate.trim()) {
             filter.createdAt = filter.createdAt || {};
             filter.createdAt.$lte = new Date(endDate);
         }
     
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await requestIssueService.queryRequestIssue(filter, options);
    res.send({ results: result , code :1});
});

const getRequestIssueById = catchAsync(async (req, res) => {
    const RequestIssue = await requestIssueService.getRequestIssueById(req.query.id);
    if (!RequestIssue) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Receipt Purchase not found');
    }
    res.send({RequestIssue, code: 1});
});

/**
 * Update receipt purchase by id
 */
const updateRequestIssue = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.RequestIssue;
    // updateData.updatedBy = req.user.id;
    const updated = await requestIssueService.updateRequestIssueById(id, updateData, req.user._id);
    res.send({ code: 1, data: updated });
});

/**
 * Delete receipt purchase by id
 */
const deleteRequestIssue = catchAsync(async (req, res) => {
    await requestIssueService.deleteRequestIssueById(req.query.id);
    res.status(httpStatus.OK).send({ code: 1 });
});


const getAllRequestIssues = catchAsync(async (req, res) => {
    const RequestIssues = await requestIssueService.getAllRequestIssue();
    res.send({ code: 1, data: RequestIssues });
});

const getRequestIssueDetailById = catchAsync(async (req, res) => {
    const RequestIssueDetails = await requestIssueService.getRequestIssueDetailById(req.query.id);
    res.send({ code: 1, data: RequestIssueDetails });
});

const updateAction = catchAsync(async (req, res) => {
    const { id, ...updateData } = req.body.RequestIssue;
    const updated = await requestIssueService.updateAction(id, updateData,  req.user._id);
    res.send({ code: 1, data: updated });
});




module.exports = {
    createRequestIssue,
    getRequestIssues,
    getRequestIssueById,
    updateRequestIssue,
    deleteRequestIssue,
    getAllRequestIssues,
    getRequestIssueDetailById,
    updateAction,
};
