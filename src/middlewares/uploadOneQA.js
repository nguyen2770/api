const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");
const fsSync = require("fs");
const CalibrationWorkModel = require("../models");
const { calibrationService } = require("../services");

const sanitizeFilename = (name) =>
    name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9.\-_]/g, "_");

const uploadOneQA = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.join(__dirname, "../../uploads/"));
        },
        filename: (req, file, cb) => {
            const safe = sanitizeFilename(file.originalname);
            cb(null, Date.now() + "-" + safe);
        }
    })
}).fields([
    { name: "pdfResult", maxCount: 1 },
    { name: "jsonResult", maxCount: 1 }
]);

const handleOneQAUpload = async (req, res, next) => {
    try {
        console.log("files:", req.files);
        const pdfFile = req.files?.pdfResult?.[0];
        const jsonFile = req.files?.jsonResult?.[0];


        console.log("pdfFile path:", pdfFile?.path);
        console.log("jsonFile path:", jsonFile?.path);
        if (!pdfFile || !jsonFile) {
            return res.status(400).json({ message: "Missing files" });
        }

        const jsonText = await fs.readFile(jsonFile.path, "utf-8");
        const jsonData = JSON.parse(jsonText);
        await fs.unlink(jsonFile.path);

        const workOrderId = jsonData.sections?.[0]?.components?.[1]?.data?.input;
        if (!workOrderId) {
            return res.status(400).json({ message: "Missing workOrderId" });
        }

        const calibrationWork = await calibrationService.getCompanyCodeById(workOrderId)
            // .find(workOrderId)
            // .populate({
            //     path: "createdBy",
            //     populate: { path: "company" }
            // });

        if (!calibrationWork) {
            return res.status(404).json({ message: "CalibrationWork not found" });
        }

        const companyCode = calibrationWork.createdBy.company.code;

        const companyDir = path.join(__dirname, `../../uploads/${companyCode}`);
        if (!fsSync.existsSync(companyDir)) {
            await fs.mkdir(companyDir, { recursive: true });
        }

        const baseName = path.parse(pdfFile.filename).name;
        const finalPath = path.join(companyDir, baseName + ".pdf");
        await fs.rename(pdfFile.path, finalPath);

        req.oneQA = {
            jsonData,
            calibrationWork,
            companyCode,
            pdfFile: {
                ...pdfFile,
                path: finalPath,
                filename: baseName + ".pdf"
            }
        };

        next();
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: "Invalid OneQA payload" });
    }
};

module.exports = {
    uploadOneQA,
    handleOneQAUpload
};