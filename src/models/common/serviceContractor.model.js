const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const serviceContractorSchema = mongoose.Schema(
    {
        serviceContractorName: {
            type: String,
            required: true,
        },
        contactPerson: {
            type: String,
        },
        contactEmail: {
            type: String,
        },
        contactPhoneNumber: {
            type: String,
        },
        address: {
            type: String,
        },
        zipCode: {
            type: String,
        },
        commune: { type: mongoose.Schema.Types.ObjectId, ref: 'Commune', default: null },
        province: { type: mongoose.Schema.Types.ObjectId, ref: 'Province', default: null },
        status: {
            type: Boolean,
            default: true,
            required: true,
        },
        createdBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        },
        updatedBy: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

serviceContractorSchema.plugin(toJSON);
serviceContractorSchema.plugin(paginate);

const ServiceContractor = mongoose.model('ServiceContractor', serviceContractorSchema);
module.exports = ServiceContractor;
