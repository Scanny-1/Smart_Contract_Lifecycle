const express = require('express');
const router = express.Router();
const { 
    createContract, 
    updateContract,
    deleteContract,
    getContracts, 
    getContractById, 
    updateApprovalStatus, 
    renewContract,
    getStats,
    getAuditLogs,
    signContract,
    reviewContract
} = require('../controllers/contractController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const uploadFields = upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'legalDocuments', maxCount: 5 },
    { name: 'financialDocuments', maxCount: 5 }
]);

router.route('/')
    .post(protect, uploadFields, createContract)
    .get(protect, getContracts);

router.get('/stats', protect, getStats);

router.route('/:id')
    .get(protect, getContractById)
    .put(protect, uploadFields, updateContract)
    .delete(protect, deleteContract);

router.get('/:id/audit', protect, getAuditLogs);

router.put('/:id/review', protect, reviewContract);
router.put('/:id/approve', protect, authorize('Admin'), updateApprovalStatus);
router.put('/:id/renew', protect, renewContract);
router.post('/:id/sign', protect, signContract);

module.exports = router;
