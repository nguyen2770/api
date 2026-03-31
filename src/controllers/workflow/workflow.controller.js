const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const { workflowService } = require('../../services');
const ApiError = require('../../utils/ApiError');

const getAllWorkflows = catchAsync(async (req, res) => {
    const workflows = await workflowService.getAllWorkflows();
    res.send({ code: 1, data: workflows });
});
const getWorkflowById = catchAsync(async (req, res) => {
    const workflow = await workflowService.getWorkflowById(req.params.id);
    if (!workflow) {
        throw new ApiError(httpStatus.NOT_FOUND, 'workflow not found');
    }
    const workflowRoles = await workflowService.getWorkflowRolesByWorkflowId(req.params.id);
    res.send({
        code: 1, data: {
            workflow,
            workflowRoles
        }
    });
});
const updateWorkflow = catchAsync(async (req, res) => {
    const updated = await workflowService.updateWorkflowById(req.params.id, {
        workflow: req.body.workflow, workflowRoles: req.body.workflowRoles
    });
    res.send({ code: 1, data: updated });
});
module.exports = {
    getAllWorkflows,
    getWorkflowById,
    updateWorkflow
};
