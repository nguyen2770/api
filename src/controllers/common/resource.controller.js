const path = require('path');
const httpStatus = require('http-status');
const fs = require('fs');
const multer = require('multer');
const { readdir, stat } = require('fs/promises');
const catchAsync = require('../../utils/catchAsync');
const { resourceService } = require('../../services');
const mime = require("mime-types");
/**
 * Create a user
 * @type {(function(*, *, *): void)|*}
 */
const createResource = catchAsync(async (req, res) => {
    req.body = {
        ...req.body,
        createdBy: req.user.id,
        updatedBy: req.user.id,
    };
    const resource = await resourceService.createResource(req.body);
    res.status(httpStatus.CREATED).send({ code: 1, resource });
});

// const uploadDir = 'E:/Project_MTC/2.api/uploads/';
const saveImage = async (req, res, next) => {
    const uploadDir = path.join(__dirname, `../../../uploads/${req.company.code}`);
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => {
            const originalName = Buffer
                .from(file.originalname, 'latin1')
                .toString('utf8');

            cb(null, originalName);
        }
    });
    const upload = multer({ storage });

    upload.single('file')(req, res, (err) => {
        if (err) return res.send(err);
        next();
    });
};
const saveDocumentBreakdown = async (req, res, next) => {
    const uploadDir = path.join(__dirname, `../../../uploads/${req.body.companyCode || req.query.companyCode}`);
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => {
            const originalName = Buffer
                .from(file.originalname, 'latin1')
                .toString('utf8');

            cb(null, originalName);
        }
    });
    const upload = multer({ storage });
    upload.single('file')(req, res, (err) => {
        if (err) return res.send(err);
        next();
    });
};
const uploadDocumentBreakdown = catchAsync(async (req, res) => {
    if (!req.file) {
        return res.status(httpStatus.OK).send({
            code: 0,
            message: 'không có file',
        });
    }
    const uploadDir = path.join(__dirname, `../../../uploads/${req.body.companyCode || req.query.companyCode}`);
    const fileName = path.parse(req.file.filename).name;
    const extension = path.extname(req.file.filename);
    const filePath = `${uploadDir}/${req.file.filename}`;

    const fileType = req.file.mimetype;

    const resource = await resourceService.createResource({
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
const uploadImage = catchAsync(async (req, res) => {
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

    const resource = await resourceService.createResource({
        fileName,
        filePath,
        extension,
        fileType,
        createdDate: new Date(),
        createdBy: req.user.id,
    });
    res.status(httpStatus.OK).send({
        code: 1,
        resourceId: resource._id,
        fileName,
    });
});
const dirSize = async (directory) => {
    const files = await readdir(directory);
    const stats = files.map((file) => stat(path.join(directory, file)));

    return (await Promise.all(stats)).reduce((accumulator, { size }) => accumulator + size, 0);
};
const getSizeUsed = catchAsync(async (req, res) => {
    const folderPath = path.join(__dirname, `../../../uploads/${req.company.code}`);
    let size = 0;
    if (fs.existsSync(folderPath)) {
        size = await dirSize(folderPath);
    }
    res.status(httpStatus.OK).send({
        code: 1,
        size,
    });
});

const getImage = catchAsync(async (req, res) => {
    const { id } = req.params;
    // Đường dẫn mặc định
    let filePath = path.join(__dirname, '../../../uploads/DEFAULT/default-img.jpg');

    // Kiểm tra id hợp lệ
    if (!id || id === 'null' || id === 'undefined') {
        return res.sendFile(path.resolve(filePath));
    }
    const resource = await resourceService.getResourceById(id);
    // Nếu có resource và file tồn tại thì lấy file thật
    if (resource && resource.filePath && fs.existsSync(resource.filePath)) {
        filePath = resource.filePath;
    }

    // Nếu file không tồn tại (kể cả mặc định), trả về lỗi
    if (!fs.existsSync(filePath)) {
        return res.status(httpStatus.NOT_FOUND).send({ code: 0, message: 'Image not found' });
    }
    res.sendFile(path.resolve(filePath));
});

const deleteImage = catchAsync(async (req, res) => {
    const { id } = req.params;
    const resource = await resourceService.getResourceById(id);
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
    await resourceService.deleteResourceById(id);
    res.status(httpStatus.OK).send({
        code: 1,
        message: `Image deleted${fileDeleted ? '' : ' (file not found, only DB record deleted)'}`,
    });
});
// Download image as attachment (forces browser to download)
const downloadImage = catchAsync(async (req, res) => {
    const { id } = req.params;

    if (!id || id === 'null' || id === 'undefined') {
        return res.status(httpStatus.BAD_REQUEST).send({ code: 0, message: 'Invalid resource id' });
    }

    const resource = await resourceService.getResourceById(id);
    if (!resource || !resource.filePath || !fs.existsSync(resource.filePath)) {
        return res.status(httpStatus.NOT_FOUND).send({ code: 0, message: 'Image not found' });
    }

    const filename =
        (resource.fileName ? resource.fileName : path.parse(resource.filePath).name) +
        (resource.extension || path.extname(resource.filePath));
    const contentType = resource.fileType || 'application/octet-stream';

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', contentType);

    const readStream = fs.createReadStream(resource.filePath);
    readStream.on('error', (err) => {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ code: 0, message: 'Error reading file' });
    });
    readStream.pipe(res);
});
const previewResource = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id) {
            return res.status(400).json({ code: 0, message: "Missing resource id" });
        }

        const resource = await resourceService.getResourceById(id);
        if (!resource || !resource.filePath || !fs.existsSync(resource.filePath)) {
            return res.status(404).json({ code: 0, message: "File not found" });
        }
        // ${req.protocol}://${req.get('host')}/v1
        const fileUrl = `resource/image/${id}`;

        const fileName = (resource.fileName || path.parse(resource.filePath).name) +
            (resource.extension || path.extname(resource.filePath));

        const extension = resource.extension || path.extname(resource.filePath);

        res.status(200).json({
            code: 1,
            data: {
                url: fileUrl,
                fileName: fileName,
                extension: extension.toLowerCase().replace('.', ''),
                mimeType: mime.lookup(resource.filePath) || "application/octet-stream",
                filePath: resource.filePath,
            }
        });
    } catch (err) {
        console.error("Preview error:", err);
        res.status(500).json({ code: 0, message: "Preview failed", error: err.message });
    }
}
module.exports = {
    createResource,
    uploadImage,
    getImage,
    deleteImage,
    saveImage,
    getSizeUsed,
    saveDocumentBreakdown,
    uploadDocumentBreakdown,
    downloadImage,
    previewResource,
};
