const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    contractId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contract',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['Created', 'Edited', 'Reviewed', 'Approved', 'Rejected', 'Deleted', 'Renewed', 'Signed']
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    details: {
        type: String
    },
    ipAddress: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
