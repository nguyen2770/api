const path = require('path');
const httpStatus = require('http-status');
const fs = require('fs');
const multer = require('multer');
const catchAsync = require('../../utils/catchAsync');
const { resourceImportDataService } = require('../../services');
const pick = require('../../utils/pick');
/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createResourceImportData = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
    };
    const resourceImportData = await resourceImportDataService.createResourceImportData(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, resourceImportData });
});

// const uploadDir = 'E:/Project_MTC/2.api/uploads/';
const saveDocumentResourceImportData = async (req, res, next) => {
    const uploadDir = path.join(__dirname, `../../../uploads/${req.company.code}`);
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => cb(null, path.parse(file.originalname).name + path.extname(file.originalname)),
    });
    const upload = multer({ storage });

    upload.single('file')(req, res, (err) => {
        if (err) return res.send(err);
        next()
    });
}

const uploadDocumentResourceImportData = catchAsync(async (req, res) => {
    if (!req.file) {
        return res.status(httpStatus.OK).send({
            code: 0,
            message: 'không có file',
        });
    }
    const uploadDir = path.join(__dirname, `../../../uploads/${req.company.code}`);
    const fileName = path.parse(req.file.filename).name;
    const extension = path.extname(req.file.filename);
    const filePath = `${uploadDir}/${req.file.filename}`;
    const fileType = req.file.mimetype;

    const resource = await resourceImportDataService.createResourceImportData({
        fileName,
        filePath,
        extension,
        fileType,
        createdDate: new Date(),
    });
    res.status(httpStatus.OK).send({
        code: 1,
        resourceId: resource._id,
        fileName,
    });
});

const getDocumentResourceImportData = catchAsync(async (req, res) => {
    const { id } = req.params;
    let filePath = path.join(__dirname, '../../../uploads/DEFAULT/default-img.jpg');

    // Kiểm tra id hợp lệ
    if (!id || id === 'null' || id === 'undefined') {
        return res.sendFile(path.resolve(filePath));
    }
    const resource = await resourceImportDataService.getResourceImportDataById(id);
    // console.log(resource)
    // Nếu có resource và file tồn tại thì lấy file thật
    const resource3 = { filePath: './uploads/file.txt' };
    console.log(fs.existsSync(resource3.filePath));
    if (resource && resource.filePath && fs.existsSync(resource.filePath)) {
        filePath = resource.filePath;
    }

    // Nếu file không tồn tại (kể cả mặc định), trả về lỗi
    if (!fs.existsSync(filePath)) {
        return res.status(httpStatus.NOT_FOUND).send({ code: 0, message: 'Image not found' });
    }
    console.log(filePath)
    res.sendFile(path.resolve(filePath));
});

const deleteDocumentResourceImportData = catchAsync(async (req, res) => {
    const { id } = req.params;
    const resource = await resourceImportDataService.getResourceImportDataById(id);
    if (!resource) {
        return res.status(httpStatus.NOT_FOUND).send({ code: 0, message: 'Image not found in database' });
    }

    // Xóa file vật lý nếu tồn tại
    let fileDeleted = false;
    if (resource.filePath && fs.existsSync(resource.filePath)) {
        try {
            fs.unlinkSync(resource.filePath);
            fileDeleted = true;
        } catch (err) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ code: 0, message: 'Cannot delete file' });
        }
    }
    // Xóa trong database
    await resourceImportDataService.deleteResourceImportDataById(id);
    res.status(httpStatus.OK).send({
        code: 1,
        message: `Image deleted${fileDeleted ? '' : ' (file not found, only DB record deleted)'}`,
    });
});
const getListResourceImportDataAssetMaintenance = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['naem']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    const data = await resourceImportDataService.getListResourceImportDataAssetMaintenance(filter, options);
    res.status(httpStatus.OK).send({
        code: 1,
        data
    });
})
const confirmCloseFileDeletion = catchAsync(async (req, res) => {
    const { id, confirmFileDeletion } = req.body;
    const data = await resourceImportDataService.confirmCloseFileDeletion(id, { confirmFileDeletion });
    res.status(httpStatus.OK).send({
        code: 1,
        data
    });
})
const confirmDeleteFile = catchAsync(async (req, res) => {
    const { id } = req.body;
    const data = await resourceImportDataService.confirmDeleteFile(id);
    res.status(httpStatus.OK).send({
        code: 1,
        data
    });
})
module.exports = {
    createResourceImportData,
    uploadDocumentResourceImportData,
    getDocumentResourceImportData,
    deleteDocumentResourceImportData,
    saveDocumentResourceImportData,
    getListResourceImportDataAssetMaintenance,
    confirmCloseFileDeletion,
    confirmDeleteFile
};
