const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const countrySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

countrySchema.plugin(toJSON);
countrySchema.plugin(paginate);

const Country = mongoose.model('Country', countrySchema);
module.exports = Country;
