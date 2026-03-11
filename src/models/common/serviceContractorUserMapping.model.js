const mongoose = require('mongoose');
const { SchemaTypes } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const serviceContractorUserMappingSchema = mongoose.Schema(
    {
        serviceContractor: {
            type: SchemaTypes.ObjectId,
            ref: 'ServiceContractor',
            default: null,
        },
        user: {
            type: SchemaTypes.ObjectId,
            ref: 'User',
            default: null,
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

serviceContractorUserMappingSchema.plugin(toJSON);
serviceContractorUserMappingSchema.plugin(paginate);

const ServiceContractorUserMapping = mongoose.model('ServiceContractorUserMapping', serviceContractorUserMappingSchema);
module.exports = ServiceContractorUserMapping;
