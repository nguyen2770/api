const mongoose = require('mongoose');
const { paginate, toJSON } = require('../plugins');
const preRemoveHook = require('../../utils/preRemoveHook');
const buildRefsToSchema = require('../../utils/buildRefsToSchema');

const customerSchema = mongoose.Schema(
    {
        customerName: { type: String, required: true },
        contactNumber: { type: String },
        contactEmail: { type: String },
        alternateContactNumber: { type: String },
        alternateContactPerson: { type: String },
        alternateEmail: { type: String },
        addressOne: { type: String },
        addressTwo: { type: String },
        resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', default: null },


        commune: { type: mongoose.Schema.Types.ObjectId, ref: 'Commune', default: null },
        province: { type: mongoose.Schema.Types.ObjectId, ref: 'Province', default: null },
        taxGroupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TaxGroup',
            default: null,
        },

        address: { type: String },

        approvalRequired: { type: Number },
        approvalRequiredCount: { type: Number },
        customerWorkorderApprova: { type: Number },
        workorderRequired: { type: Number },

        is_breakdown_auto_assign: { type: Boolean },
        is_breakdown_assign_to: { type: Boolean },

        service_engineer_group_id: { type: mongoose.Schema.Types.ObjectId, default: null },
        no_of_users: { type: Number },

        is_owner: { type: Boolean },
        owner_contact_person: { type: String },
        owner_contact_number: { type: String },
        owner_email: { type: String },
        owner_address: { type: String },

        customer_gst_number: { type: String },
        resourceImportData: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ResourceImportData',
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

customerSchema.plugin(paginate);
customerSchema.plugin(toJSON);

customerSchema.pre('remove', preRemoveHook(buildRefsToSchema('Customer')));


const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;
