const User = require('../models/User');
const Role = require('../models/Role');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).populate('roleId');

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                roleId: user.roleId,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create Employee (Admin only)
// @route   POST /api/auth/employee
// @access  Private (Admin)
const createEmployee = async (req, res) => {
    const { name, email, password, roleId } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({
            name,
            email,
            password,
            roleId
        });

        res.status(201).json({ _id: user._id, name: user.name, email: user.email, roleId: user.roleId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Users (Admin gets all users)
// @route   GET /api/auth/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).populate('roleId', 'name').select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete Employee (Admin only)
// @route   DELETE /api/auth/employee/:id
// @access  Private (Admin)
const deleteEmployee = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        await user.deleteOne();
        res.json({ message: 'User removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (user && (await user.matchPassword(oldPassword))) {
            user.password = newPassword;
            await user.save();
            res.json({ message: 'Password updated successfully' });
        } else {
            res.status(401).json({ message: 'Invalid current password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Roles
// @route   GET /api/auth/roles
// @access  Private
const getRoles = async (req, res) => {
    try {
        const roles = await Role.find({});
        res.json(roles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    loginUser,
    createEmployee,
    deleteEmployee,
    getUsers,
    changePassword,
    getRoles
};
