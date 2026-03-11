const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const workflowSchema = mongoose.Schema(
    {
        name: {
            type: String,
            default: null,
        },
        code: {
            type: String,
        },
        description: {
            type: String,
        },
        example: {
            type: String,
        },
        status: {
            type: Boolean,
            default: false,
        },
        workflowRoles : [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'WorkflowRole',
            },
        ],
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
workflowSchema.plugin(toJSON);
workflowSchema.plugin(paginate);

/**
 * @typedef User
 */
const Workflow = mongoose.model('Workflow', workflowSchema);

module.exports = Workflow;
