const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    readStatus: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum: ['Approval', 'Expiry', 'General'],
        default: 'General'
    },
    relatedContractId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contract'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
