const mongoose = require('mongoose');
const { toJSON, paginate } = require('../plugins');

const ticketPrioritySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            index: true,
        },
        colorCode: {
            type: String,
        },
    },
    { timestamps: true }
);

// add plugin that converts mongoose to json
ticketPrioritySchema.plugin(toJSON);
ticketPrioritySchema.plugin(paginate);
const TicketPriority = mongoose.model('TicketPriority', ticketPrioritySchema);

module.exports = TicketPriority;
