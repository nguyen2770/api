const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');
const preRemoveHook = require('../../utils/preRemoveHook');
const buildRefsToSchema = require('../../utils/buildRefsToSchema');


const uomSchema = new mongoose.Schema(
    {
        uomName: {
            type: String,
            required: true,
            index: true,
        },
        // symbol: {
        //     type: String,
        // },
        // isDecimal: {
        //     type: Boolean,
        //     default: true
        // },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        }
    }, { timestamps: true }
);

// add plugin that converts mongoose to json
uomSchema.plugin(toJSON);
uomSchema.plugin(paginate);

uomSchema.pre('remove', preRemoveHook(buildRefsToSchema('Uom')));


const Uom = mongoose.model('Uom', uomSchema)

module.exports = Uom;
