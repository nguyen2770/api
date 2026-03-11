const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const rolePermissionSchema = mongoose.Schema(
    {
        role: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Role',
            require: true
        },
        permission: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Permission',
            require: true
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
rolePermissionSchema.plugin(toJSON);
rolePermissionSchema.plugin(paginate);

/**
 * @typedef User
 */
const RolePermission = mongoose.model('RolePermission', rolePermissionSchema);

module.exports = RolePermission;
