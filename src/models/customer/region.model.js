const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const regionSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
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

regionSchema.plugin(toJSON);
regionSchema.plugin(paginate);

const Region = mongoose.model('Region', regionSchema);
module.exports = Region;
