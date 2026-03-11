const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const citySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    stateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'State',
      required: true,
    },
    zipCode: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

citySchema.plugin(toJSON);
citySchema.plugin(paginate);

const City = mongoose.model('City', citySchema);
module.exports = City;
