const httpStatus = require('http-status');
const { AssetMaintenance, Customer } = require('../../models');
const ApiError = require('../../utils/ApiError');

const createAssetMaintenanceCustomer = async (data) => {
    const { customerId, assetMaintenances } = data;
    if (!customerId || !Array.isArray(assetMaintenances)) {
        throw new Error("Người dùng hoặc danh sách tài sản không hợp lệ");
    }
    const customer = await Customer.findById(customerId);
    if (!customer) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
    }

    const filter = {
        _id: { $in: assetMaintenances }
    }
    const updateOperation = {
        $set: {
            customer: customerId
        }
    }

    const result = await AssetMaintenance.updateMany(filter, updateOperation);

    return {
        modifiedCount: result.nModified,
        matchedCount: result.n
    }
}

const getMaintenances = async (customer_id) => {
    const maintenances = await AssetMaintenance.find({
        customer: customer_id
    });
    return maintenances;
}

const getAssetMaintenanceCustomerById = async (id) => {
    return AssetMaintenance.findById(id);
}

const deleteAssetMaintenanceCustomerById = async (id) => {
    const asset = await getAssetMaintenanceCustomerById(id);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset not found');
    }
    asset.customer = null;
    await asset.save();
}

const getUnassignedAssetMaintenancesCustomer = async (id) => {
    const unassignedAssets = await AssetMaintenance.find({
        customer: null
    });
    return unassignedAssets;
}

module.exports = {
    createAssetMaintenanceCustomer,
    getMaintenances,
    getAssetMaintenanceCustomerById,
    deleteAssetMaintenanceCustomerById,
    getUnassignedAssetMaintenancesCustomer
};
