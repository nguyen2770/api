const { Resource } = require('../../models');
const path = require("path");

const createResource = async (resource) => {
    return Resource.create(resource);
};
const deleteResourceById = async (id) => {
    return Resource.findByIdAndDelete(id);
};
const getResourceById = async (id) => {
    return Resource.findById(id);
};
const uploadFileFromMulter = async (file, companyCode) => {
    if (!file) throw new Error("File not found");

    const fileName = path.parse(file.filename).name;
    const extension = path.extname(file.filename);
    const filePath = file.path;
    const fileType = file.mimetype;

    const resource = await createResource({
        fileName,
        filePath,
        extension,
        fileType,
        createdDate: new Date(),
    });

    return {
        resourceId: resource._id,
        fileName,
        filePath,
        fileType,
    };
};


module.exports = {
    createResource,
    deleteResourceById,
    getResourceById,
    uploadFileFromMulter
};
