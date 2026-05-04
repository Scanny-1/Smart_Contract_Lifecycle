const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password').populate('roleId');
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.roleId) {
            return res.status(403).json({ message: `Access denied. No role assigned.` });
        }

        if (allowedRoles.includes('User')) {
            return next(); // all authenticated users are 'Users'
        }

        if (!allowedRoles.includes(req.user.roleId.name)) {
            return res.status(403).json({ message: `You do not have the required permissions to access this route` });
        }
        
        next();
    };
};

module.exports = { protect, authorize };
