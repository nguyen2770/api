const mongoose = require('mongoose');
const { paginate, toJSON } = require('../plugins');

const userDetailSchema = mongoose.Schema(
  {
    // Personal Information
    firstName: { type: String },
    lastName: { type: String },
    username: { type: String},
    email: { type: String },
    password: { type: String },
    birthDay: { type: Date },
    contactNo: { type: String },
    address: { type: String },

    // Account Information
    userId: { type: String },
    userLoginName: { type: String },
    isActivated: { type: Boolean, default: true },
    status: { type: Boolean, default: true },
    isMute: { type: Boolean, default: false },
    isEnableTrainees: { type: Boolean, default: false },

    // Role and Group Information
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', default: null },
    userGroupId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserGroup', default: null },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },

    // Device Information
    loginDeviceId: { type: String },
    loginDeviceType: { type: String },
    deviceApprovalRequest: { type: Number },
    deviceApprovalStatus: { type: Number },

    // Metadata
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Additional Information
    designation: { type: String },
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', default: null },
    locationDetails: { type: String },
    serverngId: { type: Number },
  },
  {
    timestamps: true,
  }
);

userDetailSchema.plugin(paginate);
userDetailSchema.plugin(toJSON);

/**
 * @typedef User
 */
const UserDetail = mongoose.model('UserDetail', userDetailSchema);
module.exports = UserDetail;
