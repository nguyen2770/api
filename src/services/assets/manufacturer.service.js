const httpStatus = require('http-status');
const { Manufacturer } = require('../../models');
const ApiError = require('../../utils/ApiError');

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createManufacturer = async (userBody) => {
    // if (await User.isUsernameTaken(userBody.username)) {
    //     throw new ApiError(httpStatus.BAD_REQUEST, 'Username already taken');
    // }
    return Manufacturer.create(userBody);
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryManufacturers = async (filter, options) => {
    const manufacturers = await Manufacturer.paginate(filter, {
        ...options,
        populate: {
            path: 'origin',
            select: 'originName'
        }
    });
    return manufacturers;
};


const getManufacturerById = async (id) => {
    const manufacturer =  Manufacturer.findById(id)
        .populate({path: "origin", select: "originName"});
    return manufacturer;
};

const updateManufacturerById = async (manufacturerId, updateBody) => {
    const manufacturer = await getManufacturerById(manufacturerId);
    if (!manufacturer) {
        throw new ApiError(httpStatus.NOT_FOUND, 'manufacturer not found');
    }

    Object.assign(manufacturer, updateBody);
    await manufacturer.save();
    return manufacturer;
};

const deleteManufactureById = async (userId) => {
    const manufacturer = await getManufacturerById(userId);
    if (!manufacturer) {
        throw new ApiError(httpStatus.NOT_FOUND, 'manufacturer not found');
    }
    await manufacturer.remove();
    return manufacturer;
};

const getAllManufacturer = async () => {
    const manufacturer = await Manufacturer.find()
        .populate({path: "origin", select: "originName"});;
    return manufacturer;
};
module.exports = {
    queryManufacturers,
    getManufacturerById,
    updateManufacturerById,
    deleteManufactureById,
    createManufacturer,
    getAllManufacturer,
};
