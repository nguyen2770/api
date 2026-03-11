const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');
const Customer = require('../customer/customer.model');
const preRemoveHook = require('../../utils/preRemoveHook');

const taxGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,

    },
    taxes: [
      {
        name: {
          type: String,
          default: null
        },
        percentage: {
          type: Number,
          default: null
        },
      }
    ],
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

taxGroupSchema.plugin(toJSON);
taxGroupSchema.plugin(paginate);

taxGroupSchema.pre('remove', preRemoveHook([
  { model: Customer, field: 'taxGroupId' },
]));

/**
 * @typedef User
 */
const TaxGroup = mongoose.model('TaxGroup', taxGroupSchema)

module.exports = TaxGroup;