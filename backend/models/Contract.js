const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['Draft', 'Pending', 'Active', 'Expired', 'Rejected'],
        default: 'Draft'
    },
    allowedRoles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role'
    }],
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    fileURL: {
        type: String,
        required: false // Optional now, since we have specific docs
    },
    legalDocuments: [{
        type: String
    }],
    financialDocuments: [{
        type: String
    }],
    legalStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    financialStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    legalReport: {
        type: String
    },
    financialReport: {
        type: String
    },
    rejectionReason: {
        type: String
    },
    signatures: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        signedAt: {
            type: Date,
            default: Date.now
        },
        ipAddress: String,
        digitalHash: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Contract', contractSchema);
