const httpStatus = require('http-status');
const pick = require('../../utils/pick');
const ApiError = require('../../utils/ApiError');
const catchAsync = require('../../utils/catchAsync');
const { serviceContractorService } = require('../../services');


const createServiceContractor = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        // createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    const serviceContractor = await serviceContractorService.createServiceContractor(req.body);
    res.send({ code: 1, data: serviceContractor });
});
const updateStatus = catchAsync(async (req, res) => {
    const serviceContractor = await serviceContractorService.getServiceContractorById(req.params.id);
    if (!serviceContractor) {
        throw new ApiError(httpStatus.NOT_FOUND, 'serviceContractor not found');
    }
    const serviceContractorObj = serviceContractor.toObject();
    const payload = {
        status: !serviceContractorObj.status
    };
    const serviceContractorUpdate = await serviceContractorService.updateServiceContractorById(req.params.id, payload);
    res.send({ code: 1, data: serviceContractorUpdate });
});
const updateServiceContractor = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        updatedBy: req.user.id,
    };
    const serviceContractor = await serviceContractorService.updateServiceContractorById(req.params.id, req.body);
    res.send({ code: 1, data: serviceContractor });
});
const getServiceContractors = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['serviceContractorName', "contactPerson", 'contactEmail', 'contactPhoneNumber', 'searchText']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const result = await serviceContractorService.queryServiceContractors(filter, options);
    res.send({ code: 1, data: result });
});
const deleteServiceContractor = catchAsync(async (req, res) => {
    await serviceContractorService.deleteServiceContractorById(req.params.id);
    res.send({ code: 1 });
});

const getAllServiceContractors = catchAsync(async (req, res) => {
    const serviceContractors = await serviceContractorService.getAllServiceContractors();
    res.send({ code: 1, data: serviceContractors });
});
const createServiceContractorUserMapping = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        createdBy: req.user.id,
        // updatedBy: req.user.id,
    };
    const serviceContractor = await serviceContractorService.createServiceContractorUserMapping(req.body);
    res.send({ code: 1, data: serviceContractor });
});
const updateServiceContractorUserMappingById = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        updatedBy: req.user.id,
    };
    const serviceContractorUserMapping = await serviceContractorService.updateServiceContractorUserMappingById(req.params.id, req.body);
    res.send({ code: 1, data: serviceContractorUserMapping });
})
const deleteServiceContractorUserMappingById = catchAsync(async (req, res) => {
    await serviceContractorService.deleteServiceContractorUserMappingById(req.params.id);
    res.send({ code: 1 });
});
const getServiceContractorUserMappingByRes = catchAsync(async (req, res) => {
    const serviceContractors = await serviceContractorService.getServiceContractorUserMappingByRes({ serviceContractor: req.query.serviceContractor });
    res.send({ code: 1, data: serviceContractors });
});
const getListUserNotInServiceContractUserMapping = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['name', 'role', 'fullName', 'username', 'serviceContractor']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const serviceContractors = await serviceContractorService.getListUserNotInServiceContractUserMapping(filter, options);
    res.send({ code: 1, data: serviceContractors });
});

const uploadServiceContractorExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.send({ code: 0, message: "Not file" })
        }
        const result = await serviceContractorService.uploadServiceContractorExcel(req.file.path, req.file)
        return res.send({ code: 1, result })
    } catch (error) {
        return res.send({ code: 0, message: error.message || "Tải file lên không thành công" })
    }
};

module.exports = {
    getServiceContractors,
    createServiceContractor,
    updateStatus,
    updateServiceContractor,
    deleteServiceContractor,
    getAllServiceContractors,
    createServiceContractorUserMapping,
    updateServiceContractorUserMappingById,
    deleteServiceContractorUserMappingById,
    getServiceContractorUserMappingByRes,
    getListUserNotInServiceContractUserMapping,
    uploadServiceContractorExcel,
};
