const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const breakdownDefectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            index: true,
        },
        code: {
            type: Number,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
breakdownDefectSchema.plugin(toJSON);
breakdownDefectSchema.plugin(paginate);
const BreakdownDefect = mongoose.model('BreakdownDefect', breakdownDefectSchema);

module.exports = BreakdownDefect;
