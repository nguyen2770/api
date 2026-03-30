const httpStatus = require('http-status');
const mongoose = require('mongoose');
const ApiError = require('../../utils/ApiError');
const {
    PreventiveMonitoringModel,
    PreventiveMonitoringHistoryModel,
    PreventiveModel,
    AssetModelMonitoringPoint,
    SchedulePreventiveModel,
} = require('../../models');
const {
    scheduleType,
    monitoringType,
    measuringType,
    scheduleBasedOnType,
    scheduleFrequencyType,
    frequencyType,
} = require('../../utils/constant');
const schedulePreventiveService = require('./schedulePreventive.service');
const createPreventiveMonitoring = async (data, initialValue) => {
    const create = await PreventiveMonitoringModel.create(data);
    // lưu lịch sử
    const preventiveMonitoringHistory = await PreventiveMonitoringHistoryModel.findOne({
        preventiveMonitoring: create?._id,
    }).sort({ createdAt: -1 });
    await PreventiveMonitoringHistoryModel.create({
        preventiveMonitoring: create?._id,
        previousMeterValue: preventiveMonitoringHistory?.meterValue ? preventiveMonitoringHistory?.meterValue : initialValue,
        createdBy: data?.createdBy,
    });
    return create;
};
const getPreventiveMonitorings = async (filter, options, user) => {
    const payloadFilter = {};
    payloadFilter.activity = true;
    payloadFilter.supervisor = mongoose.Types.ObjectId(user);
    if (filter.monitoringPointName) {
        const monitoringPointNameFilter = await AssetModelMonitoringPoint.find({
            name: { $regex: filter.monitoringPointName, $options: 'i' },
        }).select('_id');
        const monitoringPointIds = monitoringPointNameFilter.map((item) => item._id);
        const preventiveFilter = await PreventiveModel.find({
            assetMaintenanceMonitoringPoint: { $in: monitoringPointIds },
        }).select('_id');
        const preventiveIds = preventiveFilter.map((item) => item._id);
        payloadFilter.preventive = { $in: preventiveIds };
    }

    const preventiveMonitorings = await PreventiveMonitoringModel.paginate(payloadFilter, {
        ...options,
        populate: [
            {
                path: 'preventive',
                populate: [
                    {
                        path: 'assetMaintenance',
                        populate: [
                            {
                                path: 'assetModel',
                                populate: [
                                    { path: 'customer' },
                                    { path: 'asset' },
                                    { path: 'category' },
                                    { path: 'manufacturer' },
                                    { path: 'subCategory' },
                                ],
                            },
                            { path: 'customer' },
                        ],
                    },
                    { path: 'assetMaintenanceMonitoringPoint', populate: [{ path: 'uomId' }] },
                ],
            },
            {
                path: 'supervisor',
            },
        ],
    });

    return preventiveMonitorings;
};

const getLastPreventiveMonitoringHistoryByRes = async (data) => {
    const preventiveMonitoringHistory = await PreventiveMonitoringHistoryModel.findOne(data).sort({ createdAt: -1 });
    return preventiveMonitoringHistory;
};
const updatePreventiveMonitoringById = async (id, data) => {
    const preventiveMonitoring = await PreventiveMonitoringModel.findById(id);
    if (!preventiveMonitoring) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Preventive Monitoring not found');
    }
    Object.assign(preventiveMonitoring, data);
    await preventiveMonitoring.save();
    return preventiveMonitoring;
};
const getPreventiveMonitoringHistoryByRess = async (data) => {
    const preventiveMonitoringHistorys = await PreventiveMonitoringHistoryModel.find(data)
        .populate([
            {
                path: 'preventiveMonitoring',
                populate: [
                    {
                        path: 'preventive',
                        populate: [
                            {
                                path: 'assetMaintenance',
                                populate: [
                                    {
                                        path: 'assetModel',
                                        populate: [
                                            { path: 'customer' },
                                            { path: 'asset' },
                                            { path: 'category' },
                                            { path: 'manufacturer' },
                                            { path: 'subCategory' },
                                        ],
                                    },
                                    { path: 'customer' },
                                ],
                            },
                            { path: 'assetMaintenanceMonitoringPoint', populate: [{ path: 'uomId' }] },
                        ],
                    },
                ],
            },
        ])
        .sort({ createdAt: -1 });
    return preventiveMonitoringHistorys;
};
const nextDateFrequencyType = async (date, type, next) => {
    const newDate = new Date(date);
    switch (type) {
        case frequencyType.daily:
            newDate.setDate(newDate.getDate() + next);
            break;
        case frequencyType.weekly:
            newDate.setDate(newDate.getDate() + next * 7);
            break;
        case frequencyType.monthly:
            newDate.setMonth(newDate.getMonth() + next);
            break;
        case frequencyType.yearly:
            newDate.setFullYear(newDate.getFullYear() + next);
            break;
        default:
            break;
    }
    return newDate;
};
const generateSchedulePrenventiveByPreventiveMonitoring = async (id, user) => {
    const preventiveMonitoring = await PreventiveMonitoringModel.findById(id);
    if (!preventiveMonitoring) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Preventive Monitoring not found');
    }
    if (!preventiveMonitoring.activity || preventiveMonitoring.activity === false) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Preventive Monitoring is not active');
    }
    const preventive = await PreventiveModel.findById(preventiveMonitoring.preventive);
    if (!preventive) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Preventive not found');
    }
    if (!preventive.activity || preventive.activity === false) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Preventive is not active');
    }
    if (!preventive.assetMaintenanceMonitoringPoint) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Preventive does not have asset maintenance monitoring point');
    }
    const assetMaintenanceMonitoringPoint = await AssetModelMonitoringPoint.findById(
        preventive.assetMaintenanceMonitoringPoint
    );
    if (!assetMaintenanceMonitoringPoint) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Asset Model Monitoring Point not found');
    }
    if (
        preventive.scheduleType !== scheduleBasedOnType.monitoring &&
        preventive.scheduleType !== scheduleBasedOnType.calendarOrMonitoring
    ) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Preventive schedule type must be monitoring-based');
    }
    let lastPreventiveMonitoringHistoryByRes = await getLastPreventiveMonitoringHistoryByRes({
        preventiveMonitoring: preventiveMonitoring._id,
    });
    if (!lastPreventiveMonitoringHistoryByRes) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'Preventive Monitoring History not found. Please create initial monitoring history.'
        );
    }
    let previousMeterValue = lastPreventiveMonitoringHistoryByRes?.previousMeterValue || 0;
    let lastPreventiveMonitoringMeterValue = lastPreventiveMonitoringHistoryByRes?.meterValue || 0;

    const dateLastMonitoringwithCycle = await nextDateFrequencyType(
        lastPreventiveMonitoringHistoryByRes?.createdAt,
        assetMaintenanceMonitoringPoint?.frequencyType,
        assetMaintenanceMonitoringPoint?.duration
    );
    let finalValue = 0;
    if (assetMaintenanceMonitoringPoint.measuringType === measuringType.Incremental) {
        finalValue = previousMeterValue + preventiveMonitoring?.meterValue;
    } else {
        finalValue = preventiveMonitoring?.meterValue;
    }
    if (new Date() > dateLastMonitoringwithCycle) {
        lastPreventiveMonitoringHistoryByRes = await PreventiveMonitoringHistoryModel.create({
            preventiveMonitoring: preventiveMonitoring?._id,
            previousMeterValue: previousMeterValue + lastPreventiveMonitoringMeterValue || 0,
            createdBy: user,
            meterValue: preventiveMonitoring?.meterValue,
        });
    } else {
        lastPreventiveMonitoringHistoryByRes.meterValue = preventiveMonitoring?.meterValue;
        await lastPreventiveMonitoringHistoryByRes.save();
    }
    const preventiveService = require('./preventive.service');
    const threshold = preventive?.monitoringOn;
    if (finalValue >= threshold) {
        const multiple = Math.floor(finalValue / threshold);
        const lastMultiple = Math.floor(previousMeterValue / threshold);
        if (multiple > lastMultiple) {
            await schedulePreventiveService.deleteManySchedulePreventive({
                preventiveMonitoringHistory: lastPreventiveMonitoringHistoryByRes._id,
            });
            await preventiveService.copyDataSchedulePreventiveByPreventive(
                preventive,
                user,
                Date.now(),
                lastPreventiveMonitoringHistoryByRes._id || null
            );
        }
    }

    return;
};

module.exports = {
    createPreventiveMonitoring,
    getPreventiveMonitorings,
    getLastPreventiveMonitoringHistoryByRes,
    updatePreventiveMonitoringById,
    getPreventiveMonitoringHistoryByRess,
    generateSchedulePrenventiveByPreventiveMonitoring,
};
