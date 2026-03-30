const httpStatus = require('http-status');
const { WorkflowModel, WorkflowRoleModel } = require('../../models');
const ApiError = require('../../utils/ApiError');



const getAllWorkflows = async () => {
    const workflowModels = await WorkflowModel.find();
    return workflowModels;
};
const getWorkflowById = async (workflowId) => {
    const workflow = await WorkflowModel.findById(workflowId).populate('workflowRoles');
    if (!workflow) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Workflow not found');
    }
    return workflow;
}
const getWorkflowRolesByWorkflowId = async (workflowId) => {
    const workflowRoles = await WorkflowRoleModel.find({ workflow: workflowId });
    if (!workflowRoles) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Workflow roles not found');
    }
    return workflowRoles;
};
const updateWorkflowById = async (id, { workflow, workflowRoles }) => {
    const _workflow = await getWorkflowById(id);
    if (!_workflow) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Workflow not found');
    }
    Object.assign(_workflow, workflow);
    // xoa workflowRoles cũ
    await WorkflowRoleModel.deleteMany({ workflow: id });
    // insert workflowRoles mới
    const workflowRoleModels = workflowRoles.map(roleId => ({
        role: roleId,
        workflow: id
    }))
    await WorkflowRoleModel.insertMany(workflowRoleModels);
    await _workflow.save();
    return _workflow;
}
const getWorkflowByRes = async (res) => {
    const workflow = await WorkflowModel.findOne(res);
    return workflow;
};
module.exports = {
    getAllWorkflows,
    getWorkflowById,
    updateWorkflowById,
    getWorkflowRolesByWorkflowId,
    getWorkflowByRes,
};
