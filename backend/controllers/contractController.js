const Contract = require('../models/Contract');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Create new contract
// @route   POST /api/contracts
// @access  Private
const createContract = async (req, res) => {
    try {
        const { title, description, startDate, endDate, submitForApproval, allowedRoles } = req.body;
        
        let fileURL;
        if (req.files && req.files['file'] && req.files['file'].length > 0) {
            fileURL = req.files['file'][0].path;
        }

        const legalDocuments = req.files && req.files['legalDocuments'] 
            ? req.files['legalDocuments'].map(f => f.path) : [];
            
        const financialDocuments = req.files && req.files['financialDocuments'] 
            ? req.files['financialDocuments'].map(f => f.path) : [];

        if (!fileURL && legalDocuments.length === 0 && financialDocuments.length === 0 && req.method === 'POST') {
            return res.status(400).json({ message: 'Please upload at least one contract document' });
        }

        const isSubmit = submitForApproval === 'true' || submitForApproval === true;
        
        const contract = new Contract({
            title,
            description,
            startDate,
            endDate,
            fileURL,
            legalDocuments,
            financialDocuments,
            createdBy: req.user._id,
            status: isSubmit ? 'Pending' : 'Draft',
            allowedRoles: allowedRoles ? JSON.parse(allowedRoles) : []
        });

        const createdContract = await contract.save();

        await AuditLog.create({
            contractId: createdContract._id,
            action: 'Created',
            performedBy: req.user._id,
            details: `Contract created and set to ${isSubmit ? 'Pending' : 'Draft'}`,
            ipAddress: req.ip
        });

        res.status(201).json(createdContract);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update contract (Edit or Submit from Draft)
// @route   PUT /api/contracts/:id
// @access  Private
const updateContract = async (req, res) => {
    try {
        const { title, description, startDate, endDate, submitForApproval, allowedRoles } = req.body;
        const contract = await Contract.findById(req.params.id);

        if (!contract) return res.status(404).json({ message: 'Contract not found' });

        await req.user.populate('roleId');
        const roleName = req.user.roleId ? req.user.roleId.name : null;

        if (contract.createdBy.toString() !== req.user._id.toString() && roleName !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized to edit this contract' });
        }

        if (contract.status !== 'Draft' && contract.status !== 'Rejected') {
            return res.status(400).json({ message: 'Can only edit Draft or Rejected contracts' });
        }

        contract.title = title || contract.title;
        contract.description = description !== undefined ? description : contract.description;
        contract.startDate = startDate || contract.startDate;
        contract.endDate = endDate || contract.endDate;
        
        if (req.files) {
            if (req.files['file'] && req.files['file'].length > 0) {
                contract.fileURL = req.files['file'][0].path;
            }
            if (req.files['legalDocuments']) {
                contract.legalDocuments = [...contract.legalDocuments, ...req.files['legalDocuments'].map(f => f.path)];
            }
            if (req.files['financialDocuments']) {
                contract.financialDocuments = [...contract.financialDocuments, ...req.files['financialDocuments'].map(f => f.path)];
            }
        }

        if (allowedRoles) {
            contract.allowedRoles = JSON.parse(allowedRoles);
        }

        const isSubmit = submitForApproval === 'true' || submitForApproval === true;
        if (isSubmit) {
            contract.status = 'Pending';
        }

        const updatedContract = await contract.save();

        await AuditLog.create({
            contractId: updatedContract._id,
            action: 'Edited',
            performedBy: req.user._id,
            details: `Contract edited. Status: ${contract.status}`,
            ipAddress: req.ip
        });

        res.json(updatedContract);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete contract
// @route   DELETE /api/contracts/:id
// @access  Private
const deleteContract = async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.id);

        if (!contract) return res.status(404).json({ message: 'Contract not found' });

        await req.user.populate('roleId');
        const roleName = req.user.roleId ? req.user.roleId.name : null;

        if (contract.createdBy.toString() !== req.user._id.toString() && roleName !== 'Admin') {
            return res.status(403).json({ message: 'Not authorized to delete this contract' });
        }

        if (contract.status !== 'Draft' && contract.status !== 'Rejected') {
            return res.status(400).json({ message: 'Can only delete Draft or Rejected contracts' });
        }

        await AuditLog.create({
            contractId: contract._id,
            action: 'Deleted',
            performedBy: req.user._id,
            details: `Contract deleted`,
            ipAddress: req.ip
        });

        await contract.deleteOne();
        res.json({ message: 'Contract removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all contracts
// @route   GET /api/contracts
// @access  Private
const getContracts = async (req, res) => {
    try {
        let query = {};
        await req.user.populate('roleId');
        const roleName = req.user.roleId ? req.user.roleId.name : null;

        if (roleName !== 'Admin') {
            // If standard user with a role, can see their own OR ones assigned to their role
            query.$or = [
                { createdBy: req.user._id },
                { allowedRoles: req.user.roleId }
            ];
        }
        
        const contracts = await Contract.find(query)
            .populate('createdBy', 'name email');
        res.json(contracts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get contract by ID
// @route   GET /api/contracts/:id
// @access  Private
const getContractById = async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!contract) return res.status(404).json({ message: 'Contract not found' });

        res.json(contract);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Review contract (Legal or Financial Head)
// @route   PUT /api/contracts/:id/review
// @access  Private
const reviewContract = async (req, res) => {
    try {
        const { status, report } = req.body;
        const contract = await Contract.findById(req.params.id).populate('createdBy', 'name email');

        if (!contract) return res.status(404).json({ message: 'Contract not found' });
        if (contract.status !== 'Pending') return res.status(400).json({ message: 'Contract is not Pending' });

        // populate req.user.roleId to check if Legal Head or Financial Head
        await req.user.populate('roleId');
        const roleName = req.user.roleId ? req.user.roleId.name : null;

        if (roleName === 'Legal Head') {
            contract.legalStatus = status;
            contract.legalReport = report;
        } else if (roleName === 'Financial Head') {
            contract.financialStatus = status;
            contract.financialReport = report;
        } else {
            return res.status(403).json({ message: 'Only Legal Head or Financial Head can review' });
        }

        const updatedContract = await contract.save();
        
        await AuditLog.create({ 
            contractId: contract._id, 
            action: 'Reviewed', 
            performedBy: req.user._id, 
            details: `${roleName} review submitted: ${status}`, 
            ipAddress: req.ip 
        });

        res.json(updatedContract);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve/Reject contract
// @route   PUT /api/contracts/:id/approve
// @access  Private
const updateApprovalStatus = async (req, res) => {
    try {
        const { status, reason } = req.body; 
        const contract = await Contract.findById(req.params.id).populate('createdBy', 'name email');

        if (!contract) return res.status(404).json({ message: 'Contract not found' });

        await req.user.populate('roleId');
        const roleName = req.user.roleId ? req.user.roleId.name : null;
        
        if (roleName !== 'Admin') {
            return res.status(403).json({ message: 'Only an Admin can finalize approval for this contract' });
        }

        if (status === 'Rejected') {
            contract.status = 'Rejected';
            const notification = await Notification.create({
                userId: contract.createdBy._id,
                message: `Your contract "${contract.title}" was rejected. Reason: ${reason || 'None provided'}`,
                type: 'Approval',
                relatedContractId: contract._id
            });
            req.app.get('io').to(contract.createdBy._id.toString()).emit('notification', notification);
            if (contract.createdBy.email) await sendEmail({ email: contract.createdBy.email, subject: 'Contract Rejected', message: notification.message });

            await AuditLog.create({ contractId: contract._id, action: 'Rejected', performedBy: req.user._id, details: `Rejected. Reason: ${reason || 'None'}`, ipAddress: req.ip });
        } else if (status === 'Active') {
            contract.status = 'Active';
            const notification = await Notification.create({
                userId: contract.createdBy._id,
                message: `Your contract "${contract.title}" was approved and is now Active.`,
                type: 'Approval',
                relatedContractId: contract._id
            });
            req.app.get('io').to(contract.createdBy._id.toString()).emit('notification', notification);
            if (contract.createdBy.email) await sendEmail({ email: contract.createdBy.email, subject: 'Contract Approved', message: notification.message });

            await AuditLog.create({ contractId: contract._id, action: 'Approved', performedBy: req.user._id, details: `Approved by Admin`, ipAddress: req.ip });
        }

        const updatedContract = await contract.save();
        res.json(updatedContract);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Renew contract
// @route   PUT /api/contracts/:id/renew
// @access  Private
const renewContract = async (req, res) => {
    try {
        const { newEndDate } = req.body;
        const contract = await Contract.findById(req.params.id);

        if (!contract) return res.status(404).json({ message: 'Contract not found' });

        if (contract.status !== 'Active' && contract.status !== 'Expired') {
            return res.status(400).json({ message: 'Can only renew Active or Expired contracts' });
        }

        if (!newEndDate) {
            return res.status(400).json({ message: 'Please provide a new end date' });
        }

        contract.endDate = newEndDate;
        if (contract.status === 'Expired' && new Date(newEndDate) > new Date()) {
             contract.status = 'Active';
        }

        const updatedContract = await contract.save();
        
        const populatedContract = await Contract.findById(updatedContract._id).populate('createdBy', 'name email');
        
        const notification = await Notification.create({
            userId: populatedContract.createdBy._id,
            message: `Your contract "${populatedContract.title}" has been renewed until ${new Date(newEndDate).toLocaleDateString()}.`,
            type: 'General',
            relatedContractId: populatedContract._id
        });
        req.app.get('io').to(populatedContract.createdBy._id.toString()).emit('notification', notification);
        if (populatedContract.createdBy.email) await sendEmail({ email: populatedContract.createdBy.email, subject: 'Contract Renewed', message: notification.message });

        await AuditLog.create({
            contractId: updatedContract._id,
            action: 'Renewed',
            performedBy: req.user._id,
            details: `Contract renewed until ${new Date(newEndDate).toLocaleDateString()}`,
            ipAddress: req.ip
        });

        res.json(updatedContract);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get dashboard stats
// @route   GET /api/contracts/stats
// @access  Private
const getStats = async (req, res) => {
    try {
        let baseQuery = {};
        await req.user.populate('roleId');
        const roleName = req.user.roleId ? req.user.roleId.name : null;

        if (roleName !== 'Admin') {
            baseQuery.$or = [
                { createdBy: req.user._id },
                { allowedRoles: req.user.roleId }
            ];
        }

        const total = await Contract.countDocuments(baseQuery);
        const pending = await Contract.countDocuments({ ...baseQuery, status: 'Pending' });
        const active = await Contract.countDocuments({ ...baseQuery, status: 'Active' });
        const expired = await Contract.countDocuments({ ...baseQuery, status: 'Expired' });
        const rejected = await Contract.countDocuments({ ...baseQuery, status: 'Rejected' });

        res.json({ total, pending, active, expired, rejected });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get audit logs for a contract
// @route   GET /api/contracts/:id/audit
// @access  Private
const getAuditLogs = async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.id);
        if (!contract) return res.status(404).json({ message: 'Contract not found' });

        const logs = await AuditLog.find({ contractId: req.params.id })
            .populate('performedBy', 'name email')
            .sort({ createdAt: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Sign a contract
// @route   POST /api/contracts/:id/sign
// @access  Private
const signContract = async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.id);
        if (!contract) return res.status(404).json({ message: 'Contract not found' });

        if (contract.status !== 'Active') {
            return res.status(400).json({ message: 'Can only sign Active contracts' });
        }

        // Check if already signed
        const alreadySigned = contract.signatures.find(s => s.userId.toString() === req.user._id.toString());
        if (alreadySigned) {
            return res.status(400).json({ message: 'You have already signed this contract' });
        }

        // Generate Digital Hash (simulating a signature hash based on file URL + user ID + timestamp)
        const hashInput = `${contract.fileURL}-${req.user._id}-${Date.now()}`;
        const digitalHash = crypto.createHash('sha256').update(hashInput).digest('hex');

        contract.signatures.push({
            userId: req.user._id,
            ipAddress: req.ip,
            digitalHash
        });

        const updatedContract = await contract.save();

        await AuditLog.create({
            contractId: updatedContract._id,
            action: 'Signed',
            performedBy: req.user._id,
            details: `Contract digitally signed. Hash: ${digitalHash.substring(0, 10)}...`,
            ipAddress: req.ip
        });

        res.json(updatedContract);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createContract,
    updateContract,
    deleteContract,
    getContracts,
    getContractById,
    updateApprovalStatus,
    reviewContract,
    renewContract,
    getStats,
    getAuditLogs,
    signContract
};
