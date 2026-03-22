const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const stateSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    countryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Country',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

stateSchema.plugin(toJSON);
stateSchema.plugin(paginate);

const State = mongoose.model('State', stateSchema);
module.exports = State;
