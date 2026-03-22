const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const customerSchema = mongoose.Schema(
    {
        customerName: {
            type: String,
            required: true,
            trim: true,
        },
        customerCode: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
    },
    {
        timestamps: true,
    }
);

// add plugin that converts mongoose to json
customerSchema.plugin(toJSON);
customerSchema.plugin(paginate);

/**
 * @param customerCode
 * @param excludeStudentId
 * @returns {Promise<boolean>}
 */
customerSchema.statics.isDuplicate = async function (customerCode, excludeStudentId) {
    const customer = await this.findOne({ customerCode, _id: { $ne: excludeStudentId } });
    return !!customer;
};

/**
 * @typedef User
 */
const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
