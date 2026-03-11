const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const selfDiagnosiSchema = mongoose.Schema(
    {
        assetMaintenanceSelfDiagnosiId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AssetMaintenanceSelfDiagnosi',
        },
        level: {
            type: Number,
            default: null,
        },
        title: {
            type: String,
            trim: true,
        },
        question: {
            type: Boolean,
        },
        parentId: {
            type: Number,
            trim: true,
        },
        delete: {
            type: Boolean,
        },
        // option: {
        //     type: Boolean,
        // },
        // type: {
        //     type: Boolean,
        // },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
selfDiagnosiSchema.plugin(toJSON);
selfDiagnosiSchema.plugin(paginate);

/**
 * @typedef User
 */
const SelfDiagnosi = mongoose.model('SelfDiagnosi', selfDiagnosiSchema);

module.exports = SelfDiagnosi;
