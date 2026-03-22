const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const workflowRoleSchema = mongoose.Schema(
    {
        workflow: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workflow',
            default: null,
        },
        role: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
workflowRoleSchema.plugin(toJSON);
workflowRoleSchema.plugin(paginate);

/**
 * @typedef User
 */
const WorkflowRole = mongoose.model('WorkflowRole', workflowRoleSchema);

module.exports = WorkflowRole;
