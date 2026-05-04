const express = require('express');
const router = express.Router();
const {
    loginUser, 
    changePassword, 
    createEmployee, 
    getUsers, 
    getRoles,
    deleteEmployee
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.put('/change-password', protect, changePassword);

// Admin routes
router.post('/employee', protect, authorize('Admin'), createEmployee);
router.delete('/employee/:id', protect, authorize('Admin'), deleteEmployee);
router.get('/users', protect, authorize('Admin'), getUsers);

// Roles
router.get('/roles', protect, getRoles);

module.exports = router;
