const { AssetDepreciation, AssetMaintenance } = require('../../models');
const moment = require('moment');

const createAssetDepreciation = async (assetData, userId) => {
    switch (assetData.depreciationType) {
        case 'straightLine':
            return calculateStraightLine(assetData, userId);
        case 'doubleDecliningBalance':
            return calculateDoubleDecliningBalance(assetData, userId);
        case 'sumOfTheYearsDigitsDepreciationMethod':
            return calculateSumYearsDigits(assetData, userId);
        case 'unitOfProductionDepreciationMethod':
            return calculateUnitsOfProduction(assetData, userId);
        case 'null':
            return [];
        default:
            throw new Error(`Loại khấu hao ${assetData.depreciationType} không được hỗ trợ.`);
    }
};

const updateAssetDepreciation = async (assetData, userId) => {
    const currentDate = moment().endOf('day').utc(); //.startOf('month').toDate();
    // Xóa các bản ghi dự báo 
    await AssetDepreciation.deleteMany({
        assetMaintenance: assetData.id,
        date: { $gte: currentDate },
    });
    // const lastPostedRecord = await AssetDepreciation.findOne({
    //     assetMaintenance: assetData.id,
    // }).sort({ date: -1 });

    // Cộng lũy kế cũ vào giá trị còn lại mới :
    // let newOriginValue = assetData.salvageValue + lastPostedRecord.accumulatedDepreciation;
    // const updatedAssetData = {
    //     ...assetData,
    //     id: assetData.id,
    //     salvageValue: salvageValue,
    //     originValue: newOriginValue, // nếu sửa thì phải thêm trường mới: originValue
    // };  // sửa trong assetMaintenance create/update
    switch (assetData.depreciationType) {
        case 'straightLine':
            return calculateStraightLine(assetData, userId);
        case 'doubleDecliningBalance':
            return calculateDoubleDecliningBalance(assetData, userId);
        case 'sumOfTheYearsDigitsDepreciationMethod':
            return calculateSumYearsDigits(assetData, userId);
        case 'unitOfProductionDepreciationMethod':
            return calculateUnitsOfProduction(assetData, userId);
        case 'null':
            return [];
        default:
            throw new Error(`Loại khấu hao ${assetData.depreciationType} không được hỗ trợ.`);
    }
};

const deleteAssetDepreciation = async (assetMaintenanceId) => {
    await AssetDepreciation.deleteMany({
        assetMaintenance: assetMaintenanceId,
    });
};

/*
* Khấu hao đường thẳng: (giá thanh lý nếu ko nhập mặc định là 0)
* Giá trị khấu hao hàng năm = Nguyên giá / tuổi thọ hữu ích
*/
const calculateStraightLine = async (assetData, userId, oldAccumulated = 0, oldBookValue = 0) => {
    let calDate = moment().utc();
    // calDate = calDate.subtract(5, 'months'); // test lịch trình
    const originValue = assetData.salvageValue;
    let depreciationValue = originValue / assetData.assetLifespan / 12;
    let newAccumulatedDep = 0;
    let newBookValue = originValue;
    const records = [];
    for (let i = 1; i <= assetData.assetLifespan * 12; i++) {
        calDate = calDate.add(1, 'months');
        newAccumulatedDep += depreciationValue;
        newBookValue = originValue - newAccumulatedDep;
        const record = {
            assetMaintenance: assetData.id,
            date: calDate.clone(),
            type: 'straightLine',
            base: 'lifespan',
            value: depreciationValue,
            accumulatedDepreciation: newAccumulatedDep,
            bookValue: Math.max(newBookValue, 0),
            createdBy: userId,
            updatedBy: userId,
        }
        records.push(record);
    }
    return await AssetDepreciation.insertMany(records);
};

// const reCalculateStraightLine = async (assetData, userId) => {
//     if (assetData.salvageValue <= lastPostedRecord.accumulatedDepreciation) {
//         throw new Error('Giá trị còn lại nhỏ hơn tổng giá trị đã khấu hao!');
//     }
//     const count = await AssetDepreciation.countDocuments({
//         assetMaintenance: assetData.id,
//     });
//     if (assetData.assetLifespan <= count / 12) {
//         throw new Error('Số năm sử dụng nhỏ hơn thời gian đã tính khấu hao!')
//     }
//     let newOriginValue = assetData.salvageValue - lastPostedRecord.accumulatedDepreciation;
//     let newRemainingLifespan = assetData.assetLifespan - count / 12;

//     const updatedAssetData = {
//         ...assetData,
//         id: assetData.id,
//         salvageValue: newOriginValue,
//         assetLifespan: newRemainingLifespan
//     };
//     let oldAccumulated = lastPostedRecord.accumulatedDepreciation;
//     let oldBookValue = lastPostedRecord.bookValue;

//     return calculateStraightLine(updatedAssetData, userId, oldAccumulated, oldBookValue);
// };

/*
* Khấu hao số dư giảm dần kép: (giá thanh lý nếu ko nhập mặc định là 0)
* Giá trị khấu hao hàng năm = 2 * Nguyên giá / tuổi thọ hữu ích 
* ví dụ nguyên giá 10 000, tuổi thọ 5 năm, năm đầu hao 10000 x (2/5) = 4000
* năm 2 còn 6000 => khấu hao 6000 x (2/5) = 2400
* tiếp tục cho các năm tiếp theo (hết 5 năm = 777,6)
* nếu tuổi thọ <= 2 năm thì cần giá trị thanh lý nếu không kết quả sẽ về 0 trong 1 năm
*/
const calculateDoubleDecliningBalance = async (assetData, userId) => {
    let calDate = moment().utc();
    // calDate = calDate.subtract(4, 'months'); // test lịch trình
    let originValue = assetData.salvageValue; // không đổi
    let calculatedValue = originValue;
    let depreciationValue = 2 * calculatedValue / assetData.assetLifespan / 12;
    let newAccumulatedDep = 0;
    let newBookValue = originValue;
    const records = [];
    for (let year = 1; year <= assetData.assetLifespan; year++) {
        for (let i = 1; i <= 12; i++) {
            calDate = calDate.add(1, 'months');
            newAccumulatedDep += depreciationValue;
            newBookValue = originValue - newAccumulatedDep;
            const record = {
                assetMaintenance: assetData.id,
                date: calDate.clone(),
                type: 'doubleDecliningBalance',
                base: 'lifespan',
                value: depreciationValue,
                accumulatedDepreciation: Math.min(newAccumulatedDep, originValue),
                bookValue: Math.max(newBookValue, 0),
                createdBy: userId,
                updatedBy: userId,
            }
            records.push(record);
            calculatedValue -= depreciationValue;
            if (calculatedValue <= 0) {
                console.log(calculatedValue);
                break;
            }
        }
        //calculatedValue -= 2 * calculatedValue / assetData.assetLifespan;
        depreciationValue = 2 * calculatedValue / assetData.assetLifespan / 12;

    }

    return await AssetDepreciation.insertMany(records);
};
/*
* Khấu hao sản lượng/ số lần sử dụng: (giá thanh lý nếu ko nhập mặc định là 0)
* Giá trị khấu hao/ 1 đơn vị = (Nguyên giá - giá thanh lý) / tổng sản lượng dự kiến
* Mức khấu hao hàng tháng = (Giá trị khấu hao/ 1 đơn vị) * tổng sản lượng thực tế tháng đó
* productionCapability
*/
const calculateUnitsOfProduction = async (assetData, userId) => {
    let calDate = moment().utc();
    // calDate = calDate.subtract(4, 'months'); // test lịch trình
    let originValue = assetData.salvageValue; // không đổi
    let calculatedValue = originValue;
    let depreciationPerUnit = calculatedValue / assetData.productionCapability;
    let capabilityPerMonth = assetData.productionCapabilityPerMonth;
    let newAccumulatedDep = 0;
    let newBookValue = originValue;
    const records = [];
    while (calculatedValue > 0) {
        let depreciationThisPeriod = depreciationPerUnit * capabilityPerMonth;
        calDate = calDate.add(1, 'months');
        newAccumulatedDep += depreciationThisPeriod;
        newBookValue = originValue - newAccumulatedDep;
        const record = {
            assetMaintenance: assetData.id,
            date: calDate.clone(),
            type: 'unitOfProductionDepreciationMethod',
            base: 'percentage',
            value: depreciationThisPeriod,
            accumulatedDepreciation: Math.min(newAccumulatedDep, originValue),
            bookValue: Math.max(newBookValue, 0),
            createdBy: userId,
            updatedBy: userId,
        }
        if (newBookValue < 0) {
            record.value += newBookValue;
        }
        records.push(record);
        calculatedValue -= depreciationThisPeriod;
    }
    // if (records) {
    //     const options = { new: true, runValidators: true };
    //     const lifespan = assetData.productionCapability / capabilityPerMonth / 12;
    //     const updateData = { assetLifespan: lifespan }
    //     await AssetMaintenance.findByIdAndUpdate(assetData.id, updateData, options);
    // }
    return await AssetDepreciation.insertMany(records);
};

/*
* Khấu hao tổng số năm sử dụng (tăng tốc): (giá thanh lý nếu ko nhập mặc định là 0)
* ví dụ thời gian 5 năm thì tổng số năm là 5 + 4 + 3 + 2 + 1 = 15
* Mức khấu hao hàng năm = (nguyên giá - giá thanh lý) * số năm sử dụng còn lại/ tổng số năm
* năm 1: 90 000 000 x (5 - 1 + 1)/15 = 30 000 000
* năm 2: 90 000 000 x (5 - 2 + 1)/15 = 24 000 000
* năm 3: 90 000 000 x (5 - 3 + 1)/15 = 18 000 000
* năm 4: 90 000 000 x (5 - 4 + 1)/15 = 12 000 000
* năm 5: 90 000 000 x (5 - 5 + 1)/15 = 6 000 000
* Mức khấu hao hàng tháng = hàng năm / 12
*/
const calculateSumYearsDigits = async (assetData, userId) => {
    let calDate = moment().utc();
    // calDate = calDate.subtract(4, 'months'); // test lịch trình
    let originValue = assetData.salvageValue;
    let year = assetData.assetLifespan;
    const sumOfDigits = (year * (year + 1)) / 2;
    let newAccumulatedDep = 0;
    let newBookValue = originValue;
    const records = [];

    for (let y = 1; y <= year; y++) {
        let annualRate = (year - y + 1) / sumOfDigits;
        let depreciationValue = originValue * annualRate / 12;
        for (let i = 1; i <= 12; i++) {
            calDate = calDate.add(1, 'months');
            newAccumulatedDep += depreciationValue;
            newBookValue = originValue - newAccumulatedDep;
            const record = {
                assetMaintenance: assetData.id,
                date: calDate.clone(),
                type: 'sumOfTheYearsDigitsDepreciationMethod',
                base: 'lifespan',
                value: depreciationValue,
                accumulatedDepreciation: Math.min(newAccumulatedDep, originValue),
                bookValue: Math.max(newBookValue, 0),
                createdBy: userId,
                updatedBy: userId,
            }
            records.push(record);
        }
    }
    return await AssetDepreciation.insertMany(records);
};

module.exports = {
    createAssetDepreciation,
    updateAssetDepreciation,
    deleteAssetDepreciation,
};