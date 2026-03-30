const httpStatus = require('http-status');
const { Sequence, Asset } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { SequenceMeta, SequenceCode, companyBusinessType, fundingSourcesType } = require('../../utils/constant');

const generateSequenceCode = async (sequenceCode) => {
    // Lấy sequence theo code
    let sequence = await Sequence.findOne({ code: sequenceCode });

    if (!sequence) {
        const meta = SequenceMeta[sequenceCode];
        if (!meta) throw new Error('Unknown sequence code');
        sequence = await Sequence.create({
            code: sequenceCode,
            name: meta.name,
            numberIncrement: 1,
            numberNext: 0,
            padding: 5,
            prefix: meta.prefix,
        });
    }
    // Tăng số thứ tự
    const numberNext =
        (sequence.numberNext !== undefined && sequence.numberNext !== null ? sequence.numberNext : 0) +
        (sequence.numberIncrement !== undefined && sequence.numberIncrement !== null ? sequence.numberIncrement : 1);
    // Sinh code
    const code = (sequence.prefix || '') + String(numberNext).padStart(sequence.padding || 5, '0');
    // Cập nhật lại numberNext trong DB
    sequence.numberNext = numberNext;
    await sequence.save();
    return code;
};
const generateCurrentAssetNumberBySequense = async (company, assetId, fundingSources) => {
    const asset = await Asset.findById(assetId);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'asset not found');
    }
    if (!asset?.symbol) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'Ký hiệu của thiết bị này chưa được thêm. Vui lòng truy cập vào trang Chủng loại thiết bị'
        );
    }
    if (!fundingSources) {
        throw new ApiError(httpStatus.NOT_FOUND, 'fundingSources not found');
    }
    let prefix = `${company.identifierCode}`;
    let sequence = await Sequence.findOne({ code: SequenceCode.ASSET_NUMBER });
    if (!sequence) {
        // tạo prefix
        // if (company.businessType === companyBusinessType.MEDICAL) {
        //     prefix += '-TBYT-';
        // }
        sequence = await Sequence.create({
            code: SequenceCode.ASSET_NUMBER,
            name: 'Tạo mã tài sản nội bộ',
            numberIncrement: 1,
            numberNext: 0,
            padding: 5,
        });
    }
    const numberNext =
        (sequence.numberNext !== undefined && sequence.numberNext !== null ? sequence.numberNext : 0) +
        (sequence.numberIncrement !== undefined && sequence.numberIncrement !== null ? sequence.numberIncrement : 1);
    let code =
        asset.symbol +
        '.' +
        fundingSourcesType[fundingSources] +
        '.' +
        prefix +
        '.' +
        String(numberNext).padStart(sequence.padding || 5, '0');
    return code;
};
const generateCurrentAssetNumber = async (company, assetId, serial, fundingSources) => {
    const asset = await Asset.findById(assetId);
    if (!asset) {
        throw new ApiError(httpStatus.NOT_FOUND, 'asset not found');
    }
    if (!asset?.symbol) {
        throw new ApiError(
            httpStatus.NOT_FOUND,
            'Ký hiệu của thiết bị này chưa được thêm. Vui lòng truy cập vào trang Chủng loại thiết bị'
        );
    }
    if (!fundingSources) {
        throw new ApiError(httpStatus.NOT_FOUND, 'fundingSources not found');
    }
    let prefix = `${company.identifierCode}`;
    let code = null;
    if (serial) {
        code = asset.symbol + '.' + fundingSourcesType[fundingSources] + '.' + prefix + '.' + serial;
    } else {
        let sequence = await Sequence.findOne({ code: SequenceCode.ASSET_NUMBER });
        if (!sequence) {
            // tạo prefix
            // if (company.businessType === companyBusinessType.MEDICAL) {
            //     prefix += '-TBYT-';
            // }
            sequence = await Sequence.create({
                code: SequenceCode.ASSET_NUMBER,
                name: 'Tạo mã tài sản nội bộ',
                numberIncrement: 1,
                numberNext: 0,
                padding: 5,
            });
        }
        const numberNext =
            (sequence.numberNext !== undefined && sequence.numberNext !== null ? sequence.numberNext : 0) +
            (sequence.numberIncrement !== undefined && sequence.numberIncrement !== null ? sequence.numberIncrement : 1);
        code =
            asset.symbol +
            '.' +
            fundingSourcesType[fundingSources] +
            '.' +
            prefix +
            '.' +
            String(numberNext).padStart(sequence.padding || 5, '0');
    }
    return code;
};
const saveCurrentAssetNumber = async (company) => {
    let sequence = await Sequence.findOne({ code: SequenceCode.ASSET_NUMBER });
    if (!sequence) {
        sequence = await Sequence.create({
            code: SequenceCode.ASSET_NUMBER,
            name: 'Tạo mã tài sản nội bộ',
            numberIncrement: 1,
            numberNext: 0,
            padding: 5,
        });
    }
    // Tăng số thứ tự
    const numberNext =
        (sequence.numberNext !== undefined && sequence.numberNext !== null ? sequence.numberNext : 0) +
        (sequence.numberIncrement !== undefined && sequence.numberIncrement !== null ? sequence.numberIncrement : 1);
    // Sinh code
    sequence.numberNext = numberNext;
    await sequence.save();
    return sequence;
};
module.exports = {
    generateSequenceCode,
    saveCurrentAssetNumber,
    generateCurrentAssetNumber,
    generateCurrentAssetNumberBySequense,
};
