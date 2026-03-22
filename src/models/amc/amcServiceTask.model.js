const mongoose = require('mongoose');
const { SchemaTypes, Schema } = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const amcServiceTaskSchema = Schema(
    {
        amc: {
            type: SchemaTypes.ObjectId,
            ref: 'amc',
            default: null,
        },
        amcService: {
            type: SchemaTypes.ObjectId,
            ref: 'AmcService',
            default: null,
        },
        serviceTask: {
            type: SchemaTypes.ObjectId,
            ref: 'ServiceTask',
            default: null,
        },
        totalPrice: {
            type: Number
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
amcServiceTaskSchema.plugin(toJSON);
amcServiceTaskSchema.plugin(paginate);


const AmcServiceTaskSchema = mongoose.model('AmcServiceTaskSchema', amcServiceTaskSchema);

module.exports = AmcServiceTaskSchema;
