const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const permissionSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        code: {
            type: String,
        },
        function: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Function',
            require: true
        },
        sortIndex: {
            type: Number
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
permissionSchema.plugin(toJSON);
permissionSchema.plugin(paginate);

/**
 * @typedef User
 */
const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;
