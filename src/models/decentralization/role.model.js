const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');
const preRemoveHook = require('../../utils/preRemoveHook');
const User = require('../authentication/user.model');
const WorkflowRole = require('../common/workflowRole.model');

const roleSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        code: {
            type: String,
        },

    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
roleSchema.plugin(toJSON);
roleSchema.plugin(paginate);

roleSchema.pre('remove', preRemoveHook([
    { model: User, field: 'role' },
    { model: WorkflowRole, field: 'role' },
]));
/**
 * @typedef User
 */
const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
