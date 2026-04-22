const roleUser = {
    teacher: 'teacher',
};
const bookingStatus = {
    processing: 'processing', // đang thực hiện
    success: 'success', // xác nhận được thi
    failed: 'failed', // không được phép thi
    saving: 'saving', // giữ chỗ
};
const schedulePreventiveUserType = {
    charge: 'charge',
};
const schedulePreventiveWorkingStatus = {
    assign: 'assign',
    confirmed: 'confirmed',
    processing: 'processing',
    close: 'close',
    skipped: 'skipped',
    completed: 'completed',
    reAssign: 're_assign',
};
const statusType = {
    New: 'New',
    InProgess: 'InProgess',
    Overdue: 'Overdue',
    Upcoming: 'Upcoming',
    Closed: 'Closed',
};
const breakdownStatus = {
    new: 'new',
    assigned: 'assigned',
    inProgress: 'inProgress',
    awaiting: 'awaiting',
    accepted: 'accepted',
    rejected: 'rejected',
    cancelled: 'cancelled',
    completed: 'completed',
    replacement: 'replacement',
    requestForSupport: 'requestForSupport',
    approved: 'approved',
    pendingApproval: 'pending_approval',
    submitted: 'submitted',
    WCA: 'WCA',
    reassignment: 'reassignment',
    experimentalFix: 'experimentalFix',
    pending_approval: 'pending_approval',
    cloesed: 'cloesed',
    reopen: 'reopen',
    WWA: 'WWA',
};
const breakdownAssignUserStatus = {
    assigned: 'assigned', // đc phép phân công lại
    inProgress: 'inProgress', // đc phép
    awaiting: 'awaiting',
    accepted: 'accepted', // đc phép
    rejected: 'rejected', // đc phép
    cancelled: 'cancelled',
    completed: 'completed',
    replacement: 'replacement', // đc phép
    requestForSupport: 'requestForSupport',
    approved: 'approved',
    pendingApproval: 'pending_approval',
    submitted: 'submitted',
    WCA: 'WCA',
    reassignment: 'reassignment', // đc phép
    experimentalFix: 'experimentalFix',
    pending_approval: 'pending_approval',
    cloesed: 'cloesed',
    reopen: 'reopen',
};

const progressStatus = {
    new: 'new',
    experimentalFix: 'experimentalFix',
    WCA: 'WCA',
    WWA: 'WWA',
    cloesed: 'cloesed',
    reopen: 'reopen',
    reassignment: 'reassignment',
    raised: 'raised',
    assigned: 'assigned',
    inProgress: 'inProgress',
    awaiting: 'awaiting',
    accepted: 'accepted',
    rejected: 'rejected',
    cancelled: 'cancelled',
    completed: 'completed',
    replacement: 'replacement',
    partiallyCompleted: 'partiallyCompleted',
    completeRecalibrationIssue: 'completeRecalibrationIssue',
};

const ticketBreakdownStatus = {
    new: 'new',
    inProgress: 'inProgress',
    overdue: 'overdue',
    cloesed: 'cloesed',
    completed: 'completed',
};

const codeWorkflow = {
    CLOSE_BREAKDOWN: 'CLOSE_BREAKDOWN',
    REOPEN_BREAKDOWN: 'REOPEN_BREAKDOWN',
    REASSIGN_BREAKDOWN: 'REASSIGN_BREAKDOWN',
};
const breakdownSpareRequestStatus = {
    pendingApproval: 'pending_approval',
    approved: 'approved',
    rejected: 'rejected',
    submitted: 'submitted',
    spareReplace: 'spareReplace',
};
const breakdownSpareRequestDetailStatus = {
    pendingApproval: 'pending_approval',
    approved: 'approved',
    rejected: 'rejected',
    submitted: 'submitted',
    spareReplace: 'spareReplace',
};

const ticketPreventiveStatus = {
    new: 'new',
    inProgress: 'inProgress',
    overdue: 'overdue',
    upcoming: 'upcoming',
    closed: 'closed',
};
const ticketSchedulePreventiveStatus = {
    new: 'new',
    inProgress: 'inProgress',
    overdue: 'overdue',
    upcoming: 'upcoming',
    history: 'history',
};
const preventiveStatus = {
    new: 'new',
    started: 'started',
    stoped: 'stoped',
};

const scheduleType = {
    calendar: 'Calendar',
    monitoring: 'Monitoring',
    calendarOrMonitoring: 'CalendarOrMonitoring',
    adhoc: 'Adhoc',
    conditionBasedSchedule: 'ConditionBasedSchedule',
};

const preventiveFrequencyType = {
    hours: 'Hours',
    repeatHours: 'RepeatHours',
    days: 'Days',
    date: 'Date',
    repeaetWeekDays: 'RepeaetWeekDays',
    weeks: 'Weeks',
    months: 'Months',
    years: 'Years',
};
const scheduleFrequencyType = {
    hours: 'Hours',
    repeatHours: 'RepeatHours',
    days: 'Days',
    date: 'Date',
    repeaetWeekDays: 'RepeaetWeekDays',
    weeks: 'Weeks',
    months: 'Months',
    years: 'Years',
};
const schedulePreventiveTaskAssignUserStatus = {
    assigned: 'assigned',
    accepted: 'accepted',
    replacement: 'replacement',
    inProgress: 'inProgress',
    completed: 'completed',
    partiallyCompleted: 'partiallyCompleted',
    skipped: 'skipped',
    cancelled: 'cancelled',
    reassignment: 'reassignment',
    reopen: 'reopen',
    pendingApproval: 'pending_approval',
    approved: 'approved',
    submitted: 'submitted',
};
const schedulePreventiveStatus = {
    new: 'new',
    replacement: 'replacement',
    inProgress: 'inProgress',
    waitingForAdminApproval: 'waitingForAdminApproval',
    skipped: 'skipped',
    completed: 'completed',
    cancelled: 'cancelled',
    submitted: 'submitted',
};
const historySchedulePreventiveStatus = {
    assigned: 'assigned',
    accepted: 'accepted',
    replacement: 'replacement',
    inProgress: 'inProgress',
    completed: 'completed',
    partiallyCompleted: 'partiallyCompleted',
    skipped: 'skipped',
    cancelled: 'cancelled',
    reassignment: 'reassignment',
    reopen: 'reopen',
    new: 'new',
    closed: 'closed',
    waitingForAdminApproval: 'waitingForAdminApproval',
    pendingApproval: 'pending_approval',
    approved: 'approved',
    submitted: 'submitted',
};
const calendarType = {
    noEndDate: 'no-end-date',
    endAfter: 'end-after',
    endBy: 'end-by',
};
const amcState = {
    new: 'new',
};
const assetMaintenanceStatus = {
    isActive: 'isActive',
    isNotActive: 'isNotActive',
};
const reportView = {
    summary: 'summary',
    details: 'details',
};
const notificationTypeCode = {
    // breakdown
    create_breakdown: 'create_breakdown',
    assign_user_breakdown: 'assign_user_breakdown',
    approve_breakdown: 'approve_breakdown',
    comfirm_refuse_breakdown_assign_user: 'comfirm_refuse_breakdown_assign_user',
    comfirm_accept_breakdown_assign_uer: 'comfirm_accept_breakdown_assign_uer',
    spare_part_request_breakdown: 'spare_part_request_breakdown',
    spare_parts_have_been_shipped: 'spare_parts_have_been_shipped',
    request_for_support_breakdown: 'request_for_support_breakdown',
    repair_and_testing_completed: 'repair_and_testing_completed',
    repair_completed_breakdown: 'repair_completed_breakdown',
    approve_incident_closure: 'approve_incident_closure',
    // schedulePreventive
    request_for_spare_parts_for_maintenance: 'request_for_spare_parts_for_maintenance', // yêu cầu phụ tùng
    maintenance_approval_has_been_submitted: 'maintenance_approval_has_been_submitted', // phụ tùng đã đc gửi đi
    maintenance_work_completed: 'maintenance_work_completed', // hoàn công việc bảo trì
    approve_maintenance_work: 'approve_maintenance_work', // phê duyệt đóng / mở bao trì
    assign_user_schedule_preventive: 'assign_user_schedule_preventive',
    // calibration work
    assign_user_calibration_work: 'assign_user_calibration_work',
    calibration_work_completed: 'calibration_work_completed',
    complete_the_issue_during_calibration: 'complete_the_issue_during_calibration',
    property_inspection: 'property_inspection',
    create_property_inspection: 'create_property_inspection',
};
const assetTypeMap = {
    'Máy móc / Thiết bị': 1,
    'Thiết bị đo lường': 2,
    'Thiết bị cơ sở': 3,
};
const yesNoMap = {
    Có: true,
    Không: false,
};
const sourceSave = {
    ASSETMAINTENANCE: 'ASSETMAINTENANCE',
};
const spareRequestType = {
    spareReplace: 'spareReplace',
    spareRequest: 'spareRequest',
};
const schedulePreventiveTaskRequestSparePartStatus = {
    pendingApproval: 'pending_approval',
    approved: 'approved',
    rejected: 'rejected',
    submitted: 'submitted',
    spareReplace: 'spareReplace',
};
const schedulePreventiveTaskRequestSparePartDetailStatus = {
    pendingApproval: 'pending_approval',
    approved: 'approved',
    rejected: 'rejected',
    submitted: 'submitted',
    spareReplace: 'spareReplace',
};

const SequenceCode = {
    BREAKDOWN_TIKET: 'BREAKDOWN_TIKET',
    BREAKDOWN_SPARE_REQUEST: 'BREAKDOWN_SPARE_REQUEST',
    PREVENTIVE: 'PREVENTIVE',
    SCHEDULE_PREVENTIVE: 'SCHEDULE_PREVENTIVE',
    PURCHASE_ORDER: 'PURCHASE_ORDER',
    PURCHASE_QUOTATION: 'PURCHASE_QUOTATION',
    PURCHASE_REQUEST: 'PURCHASE_REQUEST',
    SUPPLIES_NEED: 'SUPPLIES_NEED',
    SPARE_PART_REQUEST: 'SPARE_PART_REQUEST',
    CALIBRATION: 'CALIBRATION',
    CALIBRATION_WORK: 'CALIBRATION_WORK',
    STOCK_ISSUE: 'STOCK_ISSUE',
    STOCK_RECEIPT: 'STOCK_RECEIPT',
    ASSET_NUMBER: 'ASSET_NUMBER',
    PROPERTY_INSPECTION: 'PROPERTY_INSPECTION',
};

const SequenceMeta = {
    [SequenceCode.BREAKDOWN_TIKET]: {
        name: 'Sự cố',
        prefix: 'TK',
    },
    [SequenceCode.SPARE_PART_REQUEST]: {
        name: 'Yêu cầu phụ tùng',
        prefix: 'RSP',
    },
    [SequenceCode.CALIBRATION]: {
        name: 'Kế hoạch hiệu chuẩn',
        prefix: 'HC',
    },
    [SequenceCode.BREAKDOWN_SPARE_REQUEST]: {
        name: 'Yêu cầu vật tư sự cố',
        prefix: 'BSR',
    },
    [SequenceCode.PREVENTIVE]: {
        name: 'Phòng ngừa',
        prefix: 'PN',
    },
    [SequenceCode.SCHEDULE_PREVENTIVE]: {
        name: 'Quản lý lịch trình',
        prefix: 'SC',
    },
    [SequenceCode.PURCHASE_ORDER]: {
        name: 'Đơn đặt hàng',
        prefix: 'PO',
    },
    [SequenceCode.PURCHASE_QUOTATION]: {
        name: 'Báo giá mua hàng',
        prefix: 'PQ',
    },
    [SequenceCode.PURCHASE_REQUEST]: {
        name: 'Yêu cầu mua hàng',
        prefix: 'PR',
    },
    [SequenceCode.SUPPLIES_NEED]: {
        name: 'Phiếu yêu cầu vật tư',
        prefix: 'SN',
    },
    [SequenceCode.CALIBRATION_WORK]: {
        name: 'Công việc hiệu chuẩn',
        prefix: 'CW',
    },
    [SequenceCode.STOCK_RECEIPT]: {
        name: 'Phiếu nhập kho',
        prefix: 'PNK',
    },
    [SequenceCode.STOCK_ISSUE]: {
        name: 'Phiếu xuất kho',
        prefix: 'PXK',
    },
    [SequenceCode.PROPERTY_INSPECTION]: {
        name: 'Kiểm tra tài sản',
        prefix: 'KTTS',
    },
    [SequenceCode.ASSET_NUMBER]: {
        name: 'Mã tài sản',
        prefix: 'TS',
    },
};
const calibrationStatus = {
    new: 'new',
    started: 'started',
    stoped: 'stoped',
};
const calibrationWorkGroupStatus = {
    new: 'new',
    inProgress: 'inProgress',
    overdue: 'overdue',
    upcoming: 'upcoming',
    history: 'history',
};
const calibrationWorkStatus = {
    new: 'new',
    accepted: 'accepted',
    inProgress: 'inProgress',
    waitingForAdminApproval: 'waitingForAdminApproval',
    completed: 'completed',
    cancelled: 'cancelled',
    reOpen: 'reOpen',
};
const dateType = {
    days: 'days',
    weeks: 'weeks',
    months: 'months',
    years: 'years',
};
const calibrationWorkAssignUserStatus = {
    assigned: 'assigned',
    accepted: 'accepted',
    replacement: 'replacement',
    inProgress: 'inProgress',
    cancelled: 'cancelled',
    reassignment: 'reassignment',
    completed: 'completed',
    partiallyCompleted: 'partiallyCompleted',
    completeRecalibrationIssue: 'completeRecalibrationIssue',
};
const monitoringType = {
    every: 'every',
    on: 'on',
};
const scheduleBasedOnType = {
    // chưa làm
    calendar: 'Calendar',
    monitoring: 'Monitoring',
    calendarOrMonitoring: 'CalendarOrMonitoring',
    adhoc: 'Adhoc',
    conditionBasedSchedule: 'ConditionBasedSchedule',
};

const stockLocationCode = {
    INTERNAL_MAIN: 'INTERNAL_MAIN',
    VIRTUAL_MAIN: 'VIRTUAL_MAIN',
    VIRTUAL_USE: 'VIRTUAL_USE',
    VIRTUAL_WAIT_USE: 'VIRTUAL_WAIT_USE'
};
const measuringType = {
    Incremental: 'Incremental',
    Incidental: 'Incidental',
};
const frequencyType = {
    daily: 'daily',
    weekly: 'weekly',
    monthly: 'monthly',
    yearly: 'yearly',
};

const stockCode = {
    VIRTUAL_MAIN: 'VIRTUAL_MAIN',
    INTERNAL_MAIN: 'INTERNAL_MAIN',
    VIRTUAL_USE: 'VIRTUAL_USE',
    VIRTUAL_WAIT_USE: 'VIRTUAL_WAIT_USE'
};

const stockMeta = {
    [stockCode.VIRTUAL_MAIN]: {
        name: 'Kho ảo',
        usage: 'VIRTUAL',
        active: true,
    },
    [stockCode.INTERNAL_MAIN]: {
        name: 'Kho vật lý',
        usage: 'INTERNAL',
        active: true,
    },
    [stockCode.VIRTUAL_USE]: {
        name: 'Kho ảo sử dụng',
        usage: 'VIRTUAL',
        active: true,
    },
    [stockCode.VIRTUAL_WAIT_USE]: {
        name: 'Kho ảo chờ sử dụng',
        usage: 'VIRTUAL',
        active: true,
    },
};

const approvedTaskType = {
    spare_request_breakdown: 'spare_request_breakdown',
    spare_request_schedule_preventive: 'spare_request_schedule_preventive',
    close_breakdown: 'close_breakdown',
    preventive: 'preventive',
    trial_repair_approval: 'trial_repair_approval',
    close_calibration: 'close_calibration',
    supplies_need: 'supplies_need',
    purchase_request: 'purchase_request',
};
const jobSummarieType = {
    BREAKDOWN: 'BREAKDOWN',
    CALIBRATION_WORK: 'CALIBRATION_WORK',
    SCHEDULE_PREVENTIVE: 'SCHEDULE_PREVENTIVE',
    ALL: 'ALL',
};
const companyBusinessType = {
    MEDICAL: 'MEDICAL',
};
const periodMap = {
    Days: 1,
    Weeks: 2,
    Months: 3,
    Years: 4,
};
const propertyInspectionStatus = {
    waitingForAdminApproval: 'waitingForAdminApproval',
    partiallyCompleted: 'partiallyCompleted',
    completed: 'completed',
    cancelled: 'cancelled',
};
const fundingSourcesType = {
    stateBudget: '1',
    socialize: '2',
    otherSources: '3',
};
const fundingSourcesTypeMap = {
    'Ngân sách nhà nước': 'stateBudget',
    'Xã hội hóa': 'socialize',
    'Các nguồn khác': 'otherSources',
};
// const usageStatusTypeMap = {
//     'Đang sử dụng': true,
//     'Đã ngừng sử dụng': false,
// };
const createNewUsingAFormulaType = {
    healthInsurance: 'healthInsurance',
    anotherFormula: 'anotherFormula',
};
const assetStatus = {
    ACTIVE: 'ACTIVE',
    PAUSED: 'PAUSED',
    PENDING_CANCEL: 'PENDING_CANCEL',
    PENDING_DISPOSAL: 'PENDING_DISPOSAL',
    PENDING_RETURN: 'PENDING_RETURN',
    RETURNED: 'RETURNED',
    DISPOSAL: 'DISPOSAL',
};

const assetStyle = {
    machineryAndEquipment: 1,
    measuringEquipment: 2,
    accessories: 3,
};
const inventoryAssetStatus = {
    draft: 'draft',
    new: 'new',
    inProgress: 'inProgress',
    await_approve: 'await_approve',
    done: 'done',
};
const inventoryAssetDepartmentStatus = {
    draft: 'draft',
    assigned: 'assigned',
    accepted: 'accepted',
    cancel: 'cancel',
    inProgress: 'inProgress',
    pending_approval: 'pending_approval',
    approved: 'approved',
    close: 'close',
};
const inventoryAssetDepartmentAssetMaintenanceStatus = {
    exist: 'exist',
    does_not_exist: 'does_not_exist',
    not_yet_inventoried: 'not_yet_inventoried',
};
const inventoryAssetAssetMaintenanceStatus = {
    exist: 'exist',
    does_not_exist: 'does_not_exist',
    not_yet_inventoried: 'not_yet_inventoried',
};
const assetStatusMap = {
    'Đang hoạt động': assetStatus.ACTIVE,
    'Tạm dừng': assetStatus.PAUSED,
    'Chờ hủy': assetStatus.PENDING_CANCEL,
    'Chờ thanh lý': assetStatus.PENDING_DISPOSAL,
};

const workAsset = {
    breakdown: "breakdown",
    schedulePreventive: "schedulePreventive",
    calibrationWork: "calibrationWork",
}

const assetMaintenanceDocumentFileType = {
    DISPOSAL: "DISPOSAL",
    ASSET_CANCEL: "ASSET_CANCEL",
    ASSET_RETURN: "ASSET_RETURN"
}
module.exports = {
    roleUser,
    bookingStatus,
    schedulePreventiveUserType,
    schedulePreventiveWorkingStatus,
    statusType,
    breakdownAssignUserStatus,
    progressStatus,
    ticketBreakdownStatus,
    codeWorkflow,
    breakdownSpareRequestStatus,
    breakdownSpareRequestDetailStatus,
    ticketPreventiveStatus,
    preventiveStatus,
    schedulePreventiveStatus,
    scheduleType,
    scheduleFrequencyType,
    ticketSchedulePreventiveStatus,
    schedulePreventiveTaskAssignUserStatus,
    historySchedulePreventiveStatus,
    calendarType,
    preventiveFrequencyType,
    amcState,
    breakdownStatus,
    assetMaintenanceStatus,
    reportView,
    notificationTypeCode,
    assetTypeMap,
    yesNoMap,
    sourceSave,
    spareRequestType,
    schedulePreventiveTaskRequestSparePartStatus,
    schedulePreventiveTaskRequestSparePartDetailStatus,
    SequenceCode,
    SequenceMeta,
    calibrationWorkStatus,
    dateType,
    calibrationWorkAssignUserStatus,
    calibrationWorkGroupStatus,
    calibrationStatus,
    monitoringType,
    scheduleBasedOnType,
    stockLocationCode,
    measuringType,
    frequencyType,
    stockMeta,
    stockCode,
    approvedTaskType,
    jobSummarieType,
    companyBusinessType,
    periodMap,
    fundingSourcesTypeMap,
    propertyInspectionStatus,
    fundingSourcesType,
    assetStatusMap,
    createNewUsingAFormulaType,
    assetStatus,
    assetStyle,
    inventoryAssetStatus,
    inventoryAssetDepartmentStatus,
    inventoryAssetDepartmentAssetMaintenanceStatus,
    inventoryAssetAssetMaintenanceStatus,
    workAsset,
    assetMaintenanceDocumentFileType
};
