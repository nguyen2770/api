const catchAsync = require('../../utils/catchAsync');
const { workReportByPersonService } = require('../../services');
const ApiError = require('../../utils/ApiError');
const pick = require('../../utils/pick');
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

const getWorkReportByPerson = catchAsync(async (req, res) => {
    const options = pick(req.body, ['sortBy', 'sortOrder', 'limit', 'page']);
    const filter = pick(req.body, ['startDate', 'endDate', 'userName', 'branchs']);
    const { reports, totalPages, totalResults, page, limit } = await workReportByPersonService.getWorkReportByPerson(filter, options, req);
    res.send({
        code: 1,
        reports,
        page,
        limit,
        totalPages,
        totalResults,
    });
});
const getListWorkReportByPerson = catchAsync(async (req, res) => {
    const options = pick(req.body, ['sortBy', 'sortOrder', 'limit', 'page']);
    const filter = pick(req.body, ['userId', 'workList', 'code', 'assetName', 'jobType', 'status']);
    const { reports, totalPages, totalResults, page, limit } = await workReportByPersonService.getListWorkReportByPerson(filter, options);
    res.send({
        code: 1,
        reports,
        page,
        limit,
        totalPages,
        totalResults,
    });
});
const getResource = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['jobType', 'id']);
    const listDocuments = await workReportByPersonService.getResource(filter);
    res.send({
        code: 1,
        listDocuments,
    });
});
const getFileZip = catchAsync(async (req, res) => {
    const { filePaths } = req.body;
    const UPLOAD_ROOT = path.join(__dirname, '..', '..', '..', 'uploads');
    res.attachment('Bao_cao_tai_lieu.zip');
    const archive = archiver('zip', {
        zlib: { level: 9 }
    });
    archive.on('error', (err) => {
        res.status(500).send({ error: err.message });
    });
    archive.pipe(res);
    filePaths.forEach((relPath) => {
        const fullPath = path.join(UPLOAD_ROOT, relPath);
        if (fs.existsSync(fullPath)) {
            archive.file(fullPath, { name: path.basename(fullPath) });
        }
    });

    await archive.finalize();
});

module.exports = {
    getWorkReportByPerson,
    getListWorkReportByPerson,
    getResource,
    getFileZip,
}