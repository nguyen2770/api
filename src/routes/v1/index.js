const express = require('express');
const authRoute = require('./authentication/auth.route');
const userRoute = require('./authentication/user.route');
const manufacturerRoute = require('./assets/manufacturer.route');
const categoryRoute = require('./assets/category.route');
const spareCategoryRoute = require('./assets/spareCategory.route');
const serviceCategoryRoute = require('./assets/serviceCategory.route');
const serviceContractorRoute = require('./common/serviceContractor.route');
const serviceSubCategoryRoute = require('./assets/serviceSubCategory.route');
const spareSubCategoryRoute = require('./assets/spareSubCategory.route');
const assetRoute = require('./assets/asset.route');
const assetTypeRoute = require('./assets/assetType.route');
const subCategoryRoute = require('./assets/subCategory.route');
const groupRoute = require('./user/group.route');
const assetMaintenanceRoute = require('./common/assetMaintenance.route');
const assetIdinfoRoute = require('./common/assetIdinfo.route');
const taxGroup = require('./common/taxGroup.route');
const building = require('./customer/building.route');
const department = require('./customer/department.route');
const floor = require('./customer/floor.route');
const resource = require('./common/resource.route');
const serviceRoute = require('./services/service.route');
const assetModelMonitoringPointRoute = require('./assets/assetModelMonitoringPoint.route');
const assetMaintenanceAdditionalInfo = require('./common/assetMaintenanceAdditionalInfo.route');
const assetMaintenanceDefect = require('./common/assetMaintenanceDefect.route');
const assetMaintenanceSolutionBank = require('./common/assetMaintenanceSolutionBank.route');
const sparePartsRoute = require('./sparePart/spareParts.route');
const customerSpareStockRoute = require('./sparePart/customerSpareStock.route');
const userSpareStockRoute = require('./sparePart/userSpareStock.route');
const assetMaintenanceSelfDiagnosi = require('./common/assetMaintenanceSelfDiagnosi.route');
const assetMaintenanceDocument = require('./common/assetMaintenanceDocument.route');
const assetMaintenanceSchedule = require('./common/assetMaintenanceSchedule.route');
const assetModelSparePartRoute = require('./assets/assetModelSparePart.route');
const complianceTypeRoute = require('./common/complianceType.route');
const contractTypeRote = require('./common/contractType.route');
const breakdownRote = require('./common/breakdown.route');
const breakdownAssignUserRoute = require('./common/breakdownAssignUser.route');
const preventiveRoute = require('./preventive/preventive.route');
const preventiveTaskAssignUserRoute = require('./preventive/preventiveTaskAssignUser.route');
const uomRoute = require('./common/uom.route');
const state = require('./customer/state.route');
const country = require('./customer/country.route');
const region = require('./customer/region.route');
const city = require('./customer/city.route');
const customers = require('./customer/customer.route');
const config = require('../../config/config');
const assetModelParameterRoute = require('./assets/assetModelParameter.route');
const assetModelFailureTypeRoute = require('./assets/assetModelFailureType.route');
const assetModelSeftDiagnosiaRoute = require('./assets/assetModelSeftDiagnosia.route');
const assetModelSolutionRoute = require('./assets/assetModelSolution.route');
const purchaseQuotation = require('./purchase/quotation.route');
const schedulePreventiveRoute = require('./preventive/schedulePreventive.route');
const suppliesNeed = require('./purchase/suppliesNeed.route');
const suppliesNeedSparePart = require('./purchase/suppliesNeedSparePart.route');
const requestPurchase = require('./purchase/requestPurchase.route');
const purchaseOrders = require('./purchase/purchaseOrders.route');
const stockReceipt = require('./purchase/stockReceipt.route');
const requestIssue = require('./purchase/requestIssue.route');
const receiptIssue = require('./purchase/stockIssue.route');
const returnToSupplier = require('./purchase/returnToSupplier.route');
const branch = require('./common/branch.route');
const assetModelRoute = require('./common/assetModel.route');
const supplierRoute = require('./common/supplier.route');
const assetTypeCategoryRoute = require('./assets/assetTypeCategory.route');
const assetTypeParameterRoute = require('./assets/assetTypeParameter.route');
const servicePackageRoute = require('./services/servicePackage.route');
const amcRoute = require('./amc/amc.route');
const assetModelDocument = require('./assets/assetModelDocument.route');
const breakdownSpareRequest = require('./common/breakdownSpareRequest.route');
const roleRoute = require('./decentralization/role.route');
const workflowRoute = require('./workflow/workflow.route');
const originRoute = require('./common/origin.route');
const assetTypeManufacturer = require('./assets/assetTypeManufacturer.route');
const inventoryRoute = require('./purchase/inventory.route');
const reportRoute = require('./report/report.route');
const qrCodeSettingRoute = require('./common/qrCodeSetting.route');
const assetMaintenanceUser = require('./common/assetMaintenanceUser.route');
const geographyRoute = require('./customer/geography.route');
const reportBreakdownRoute = require('./report/reportBreakdown.route');
const reportSchedulePreventiveRoute = require('./report/reportSchedulePreventive.route');
const reportBreakdownSchedulePreventiveRoute = require('./report/reportBreakdownSchedulePreventive.route');
const reportAssetMaintenanceRoute = require('./report/reportAssetMaintenance.route');
const reportAssetDepreciation = require('./report/reportAssetDepreciation.route');
const workReportByPerson = require('./report/workReportByPerson.route');
const notificationRoute = require('./notification/notification.route');
const importDataRoute = require('./common/importData.route');
const resourceImportDataRoute = require('./common/resourceImportData.route');
const assetMaintenanceIsNotActiveHistoryRoute = require('./common/assetMaintenanceIsNotActiveHistory.route');
const assetMaintenanceCustomer = require('./common/assetMaintenanceCustomer.route');
const preventiveOfModelRoute = require('./preventive/preventiveOfModel.route');
const schedulePreventiveTaskRequestSparepartRoute = require('./preventive/schedulePreventiveTaskRequestSparepart.route');
// const devRoute = require('./dev.route');
const calibrationRoute = require('./calibration/calibration.route');
const calibrationWorkRoute = require('./calibration/calibrationWork.route');
const preventiveMonitoringRoute = require('./preventive/preventiveMonitoring.route');
const calibrationContractRoute = require('./calibration/calibrationContract.route');
const repairContractRoute = require('./contract/repairContract.route');
const stockLocationRouter = require('./purchase/stockLocation.route');
const jobSummaryRouter = require('./common/jobSummary.route');
const schedulePreventiveDocumentsRoute = require('./preventive/schedulePreventiveDocuments.route');
const calibrationWorkDocumentsRoute = require('./calibration/calibrationWorkDocuments.route');
const assetModelChecklistRoute = require('./assets/assetModelChecklist.routr');
const propertyInspectionRoute = require('./preventive/propertyInspection.route');
const assetMaintenanceCostReportRoute = require('./report/assetMaintenanceCostReport.route');
const inventoryAssetRoute = require('./inventoryAsset/inventoryAsset.route');
const router = express.Router();

const authenticationRoutes = [
    {
        path: '/auth',
        route: authRoute,
    },
    {
        path: '/users',
        route: userRoute,
    },
];

authenticationRoutes.forEach((route) => {
    router.use(route.path, route.route);
});
// decentralization
const decentralizationRoutes = [
    {
        path: '/role',
        route: roleRoute,
    },
];
decentralizationRoutes.forEach((route) => {
    router.use(route.path, route.route);
});
// assets

const assets = [
    {
        path: '/manufacturer',
        route: manufacturerRoute,
    },
    {
        path: '/spare-category',
        route: spareCategoryRoute,
    },
    {
        path: '/spare-sub-category',
        route: spareSubCategoryRoute,
    },
    {
        path: '/category',
        route: categoryRoute,
    },
    {
        path: '/service-category',
        route: serviceCategoryRoute,
    },
    {
        path: '/service-sub-category',
        route: serviceSubCategoryRoute,
    },
    {
        path: '/asset',
        route: assetRoute,
    },
    {
        path: '/assetType',
        route: assetTypeRoute,
    },
    {
        path: '/subCategory',
        route: subCategoryRoute,
    },
    {
        path: '/asset-model-parameter',
        route: assetModelParameterRoute,
    },
    {
        path: '/asset-model-failure-type',
        route: assetModelFailureTypeRoute,
    },
    {
        path: '/asset-model-seft-diagnosia',
        route: assetModelSeftDiagnosiaRoute,
    },
    {
        path: '/asset-model-spare-part',
        route: assetModelSparePartRoute,
    },
    {
        path: '/asset-model-monitoring-point',
        route: assetModelMonitoringPointRoute,
    },
    {
        path: '/asset-model-solution',
        route: assetModelSolutionRoute,
    },
    {
        path: '/assetTypeCategory',
        route: assetTypeCategoryRoute,
    },
    {
        path: '/assetTypeParameter',
        route: assetTypeParameterRoute,
    },
    {
        path: '/assetModelDocument',
        route: assetModelDocument,
    },
    {
        path: '/assetTypeManufacturer',
        route: assetTypeManufacturer,
    },
    {
        path: '/assetModelChecklist',
        route: assetModelChecklistRoute,
    },
];

assets.forEach((route) => {
    router.use(route.path, route.route);
});
const users = [
    {
        path: '/group',
        route: groupRoute,
    },
];

users.forEach((route) => {
    router.use(route.path, route.route);
});

assets.forEach((route) => {
    router.use(route.path, route.route);
});
const commons = [
    {
        path: '/assetMaintenance',
        route: assetMaintenanceRoute,
    },
    {
        path: '/taxGroup',
        route: taxGroup,
    },
    {
        path: '/resource',
        route: resource,
    },
    {
        path: '/assetIdInfo',
        route: assetIdinfoRoute,
    },
    {
        path: '/service-contractor',
        route: serviceContractorRoute,
    },
    {
        path: '/branch',
        route: branch,
    },
    {
        path: '/assetModel',
        route: assetModelRoute,
    },
    {
        path: '/supplier',
        route: supplierRoute,
    },
    {
        path: '/breakdownSpareRequest',
        route: breakdownSpareRequest,
    },
    {
        path: '/origin',
        route: originRoute,
    },
    {
        path: '/assetMaintenanceUser',
        route: assetMaintenanceUser,
    },
    {
        path: '/assetMaintenanceCustomer',
        route: assetMaintenanceCustomer,
    },
    {
        path: '/importData',
        route: importDataRoute,
    },
    {
        path: '/resourceImportData',
        route: resourceImportDataRoute,
    },
    {
        path: '/assetMaintenanceIsNotActiveHistory',
        route: assetMaintenanceIsNotActiveHistoryRoute,
    },
    {
        path: '/jobSummary',
        route: jobSummaryRouter,
    },
];

commons.forEach((route) => {
    router.use(route.path, route.route);
});

const customer = [
    {
        path: '/building',
        route: building,
    },
    {
        path: '/department',
        route: department,
    },
    {
        path: '/floor',
        route: floor,
    },
    {
        path: '/city',
        route: city,
    },
    {
        path: '/country',
        route: country,
    },
    {
        path: '/region',
        route: region,
    },
    {
        path: '/state',
        route: state,
    },
    {
        path: '/customer',
        route: customers,
    },
    {
        path: '/assetMaintenanceAdditionalInfo',
        route: assetMaintenanceAdditionalInfo,
    },
    {
        path: '/assetMaintenanceDefect',
        route: assetMaintenanceDefect,
    },
    {
        path: '/assetMaintenanceSolutionBank',
        route: assetMaintenanceSolutionBank,
    },
    {
        path: '/assetMaintenanceSelfDiagnosi',
        route: assetMaintenanceSelfDiagnosi,
    },
    {
        path: '/assetMaintenanceDocument',
        route: assetMaintenanceDocument,
    },
    {
        path: '/assetMaintenanceSchedule',
        route: assetMaintenanceSchedule,
    },
    {
        path: '/contractTypeRoute',
        route: contractTypeRote,
    },
    {
        path: '/complianceTypeRoute',
        route: complianceTypeRoute,
    },
    {
        path: '/breakdown',
        route: breakdownRote,
    },
    {
        path: '/uom',
        route: uomRoute,
    },
    {
        path: '/breakdownAssignUser',
        route: breakdownAssignUserRoute,
    },
    {
        path: '/preventive',
        route: preventiveRoute,
    },
    {
        path: '/preventiveTaskAssignUser',
        route: preventiveTaskAssignUserRoute,
    },
    {
        path: '/schedulePreventive',
        route: schedulePreventiveRoute,
    },
    {
        path: '/schedulePreventiveDocuments',
        route: schedulePreventiveDocumentsRoute,
    },
    {
        path: '/preventiveOfModel',
        route: preventiveOfModelRoute,
    },
    {
        path: '/schedulePreventiveTaskRequestSparepart',
        route: schedulePreventiveTaskRequestSparepartRoute,
    },
    {
        path: '/geography',
        route: geographyRoute,
    },
    {
        path: '/preventiveMonitoring',
        route: preventiveMonitoringRoute,
    },
    {
        path: '/stockLocation',
        route: stockLocationRouter,
    },
    {
        path: '/propertyInspection',
        route: propertyInspectionRoute,
    },
];

customer.forEach((route) => {
    router.use(route.path, route.route);
});

const service = [
    {
        path: '/service',
        route: serviceRoute,
    },
    {
        path: '/service-package',
        route: servicePackageRoute,
    },
];

service.forEach((route) => {
    router.use(route.path, route.route);
});
const stockRoutes = [
    {
        path: '/spare-parts',
        route: sparePartsRoute,
    },
    {
        path: '/customer-spare-stock',
        route: customerSpareStockRoute,
    },
    {
        path: '/user-spare-stock',
        route: userSpareStockRoute,
    },
];

stockRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

const purchase = [
    {
        path: '/supplies-need',
        route: suppliesNeed,
    },
    {
        path: '/supplies-need-spare-part',
        route: suppliesNeedSparePart,
    },
    {
        path: '/request-purchase',
        route: requestPurchase,
    },
    {
        path: '/order-purchase',
        route: purchaseOrders,
    },
    {
        path: '/receipt-purchase',
        route: stockReceipt,
    },
    {
        path: '/request-issue',
        route: requestIssue,
    },
    {
        path: '/receipt-issue',
        route: receiptIssue,
    },
    {
        path: '/return-supplier',
        route: returnToSupplier,
    },
    {
        path: '/purchase-quotation',
        route: purchaseQuotation,
    },
    {
        path: '/inventory',
        route: inventoryRoute,
    },
];

purchase.forEach((route) => {
    router.use(route.path, route.route);
});
const amc = [
    {
        path: '/amc',
        route: amcRoute,
    },
];
amc.forEach((route) => {
    router.use(route.path, route.route);
});
const workflow = [
    {
        path: '/workflow',
        route: workflowRoute,
    },
];
workflow.forEach((route) => {
    router.use(route.path, route.route);
});
const report = [
    {
        path: '/report',
        route: reportRoute,
    },
    {
        path: '/reportBreakdown',
        route: reportBreakdownRoute,
    },
    {
        path: '/reportSchedulePreventive',
        route: reportSchedulePreventiveRoute,
    },
    {
        path: '/reportBreakdownSchedulePreventive',
        route: reportBreakdownSchedulePreventiveRoute,
    },
    {
        path: '/reportAssetMaintenance',
        route: reportAssetMaintenanceRoute,
    },
    {
        path: '/reportAssetDepreciation',
        route: reportAssetDepreciation,
    },
    {
        path: '/workReportByPerson',
        route: workReportByPerson,
    },
    {
        path: '/assetMaintenanceCostReport',
        route: assetMaintenanceCostReportRoute,
    },
];
report.forEach((route) => {
    router.use(route.path, route.route);
});

const qrCodeSetting = [
    {
        path: '/qr-code-setting',
        route: qrCodeSettingRoute,
    },
];
qrCodeSetting.forEach((route) => {
    router.use(route.path, route.route);
});
const notificationStatic = [
    {
        path: '/notification',
        route: notificationRoute,
    },
];
notificationStatic.forEach((route) => {
    router.use(route.path, route.route);
});
const calibration = [
    {
        path: '/calibration',
        route: calibrationRoute,
    },
    {
        path: '/calibrationWork',
        route: calibrationWorkRoute,
    },
    {
        path: '/calibrationContract',
        route: calibrationContractRoute,
    },
    {
        path: '/calibrationWorkDocuments',
        route: calibrationWorkDocumentsRoute,
    },
];
calibration.forEach((route) => {
    router.use(route.path, route.route);
});
const contractRoute = [
    {
        path: '/repairContract',
        route: repairContractRoute,
    },
];

contractRoute.forEach((route) => {
    router.use(route.path, route.route);
});
const _inventoryAssetRoute = [
    {
        path: '/inventory-asset',
        route: inventoryAssetRoute,
    },
];

_inventoryAssetRoute.forEach((route) => {
    router.use(route.path, route.route);
});
/* istanbul ignore next */
if (config.env === 'development') {
    // devRoutes.forEach((route) => {
    //     router.use(route.path, route.route);
    // });
}

module.exports = router;
