const mongoose = require('mongoose');

const { Schema } = mongoose;
const { toJSON, paginate } = require('../plugins');
const preRemoveHook = require('../../utils/preRemoveHook');
const buildRefsToSchema = require('../../utils/buildRefsToSchema');

const departmentSchema = new Schema(
    {
        departmentName: {
            type: String,
            required: true,
        },
        departmentCapacity: {
            type: Number,
        },
        resourceImportData: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ResourceImportData',
            default: null,
        },
        status: {
            type: Boolean,
            default: true,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        allowViewAll: {
            type: Boolean,
            default: false, // true: user thuộc phòng ban này xem được tất cả tài sản, false: user thuộc phòng này chỉ xem được tài sản phòng này
        }
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
departmentSchema.plugin(toJSON);
departmentSchema.plugin(paginate);

departmentSchema.pre('remove', preRemoveHook(buildRefsToSchema('Department')));

/**
 * @typedef User
 */
const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;
