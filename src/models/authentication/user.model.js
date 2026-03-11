const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('../plugins');
const preRemoveHook = require('../../utils/preRemoveHook');
const buildRefsToSchema = require('../../utils/buildRefsToSchema');

const userSchema = mongoose.Schema(
    // {
    //     username: {
    //         type: String,
    //         unique: true,
    //         trim: true,
    //         lowercase: true,
    //         maxLength: 20,
    //     },
    //     // fullName: {
    //     //     type: String,
    //     //     required: true,
    //     //     trim: true,
    //     // },
    //     password: {
    //         type: String,
    //         // required: true,
    //         trim: true,
    //         minlength: 6,
    //         // validate(value) {
    //         //     if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    //         //         throw new Error('Password must contain at least one letter and one number');
    //         //     }
    //         // },
    //         private: true, // used by the toJSON plugin
    //     },
    //     role: {
    //         type: String,
    //         required: true,
    //         enum: roles,
    //         default: 'teacher',
    //     },
    //     active: {
    //         type: Boolean,
    //         required: true,
    //         default: true,
    //     },
    //     createdBy: {
    //         type: SchemaTypes.ObjectId,
    //         ref: 'User',
    //         default: null,
    //     },
    //     updatedBy: {
    //         type: SchemaTypes.ObjectId,
    //         ref: 'User',
    //         default: null,
    //     },
    //     // school: {
    //     //     type: SchemaTypes.ObjectId,
    //     //     required: true,
    //     //     // enum: roles,
    //     //     ref: 'School',
    //     // },
    // },
    // {
    //     timestamps: true,
    // }

    {
        // Personal Information
        firstName: { type: String },
        lastName: { type: String },
        fullName:
        {
            type: String,
        },
        phoneNumber:
        {
            type: String,
        },
        address:
        {
            type: String,
        },
        email: { type: String },
        password:
        {
            type: String, trim: true,
            minlength: 6, private: true
        },
        birthDay: { type: Date },
        contactNo: { type: String },
        username: { type: String },
        active: { type: Boolean, default: true },
        status: { type: Boolean, default: true },
        isMute: { type: Boolean, default: false },
        isEnableTrainees: { type: Boolean, default: false },

        // Role and Group Information
        role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', default: null },
        userGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'UserGroup', default: null },
        department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
        branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
        company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },

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
        avatar: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', default: null },
        lastLoginTime: { type: Date }
    },
    {
        timestamps: true,
    }
);


// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} username - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isUsernameTaken = async function (username, excludeUserId) {
    const user = await this.findOne({ username, _id: { $ne: excludeUserId } });
    return !!user;
};

/**
 * Check if email is taken
 * @param {string} phoneNumber - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isPhoneTaken = async function (phoneNumber, excludeUserId) {
    const user = await this.findOne({ phoneNumber, _id: { $ne: excludeUserId } });
    return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
    const user = this;
    return bcrypt.compare(password, user.password);
};

userSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});

userSchema.pre('remove', preRemoveHook(buildRefsToSchema('User')));

const User = mongoose.model('User', userSchema);

module.exports = User;
