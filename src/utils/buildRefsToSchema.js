const mongoose = require('mongoose');

const buildRefsToSchema = (schemaName) => {
  const refs = [];
  for (const modelName in mongoose.models) {
    const model = mongoose.models[modelName];
    for (const [field, schemaType] of Object.entries(model.schema.paths)) {
      if (schemaType.options?.ref === schemaName) {
        refs.push({ model, field });
      }
    }
  }
  return refs;
};

module.exports = buildRefsToSchema;
