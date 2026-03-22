const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const userBranchSchema = mongoose.Schema(
    {
        user: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            required: true,
        },
        branch: {
            type: SchemaTypes.ObjectId,
            ref: 'Branch',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
userBranchSchema.plugin(toJSON);
userBranchSchema.plugin(paginate);

const UserBranch = mongoose.model('UserBranch', userBranchSchema);

module.exports = UserBranch;
