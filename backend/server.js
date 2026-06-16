const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const authRoutes = require('./routes/authRoutes');
const contractRoutes = require('./routes/contractRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const initCronJobs = require('./jobs/cronJobs');
const User = require('./models/User');
const Role = require('./models/Role');
const bcrypt = require('bcryptjs');

dotenv.config();

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
}

// Dynamic CORS configuration
const corsOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) 
    : ['http://localhost:5173', 'http://localhost:3000'];

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: false, // allow local uploads to be served
}));
app.use(cors({
    origin: corsOrigins,
    credentials: true
}));
app.use(express.json());
// app.use(mongoSanitize()); // Removed because it's incompatible with Express 5 (req.query is a getter)

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/notifications', notificationRoutes);

// Database Connection
// Initialize Database with Roles and Admin
const initDB = async () => {
    try {
        const roles = ['Admin', 'Manager', 'Legal Head', 'Financial Head'];
        for (const roleName of roles) {
            const exists = await Role.findOne({ name: roleName });
            if (!exists) {
                await Role.create({ name: roleName });
                console.log(`Role ${roleName} created`);
            }
        }

        const adminRole = await Role.findOne({ name: 'Admin' });
        const adminExists = await User.findOne({ email: 'scannykomal_nakkala@srmap.edu.in' });
        
        if (!adminExists && adminRole) {
            await User.create({
                name: 'System Admin',
                email: 'scannykomal_nakkala@srmap.edu.in',
                password: 'Admin@111',
                roleId: adminRole._id
            });
            console.log('Default Admin user created successfully.');
        }
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/contract_management')
    .then(() => {
        console.log('MongoDB Connected');
        initDB();
        // Initialize Cron Jobs
        initCronJobs();
    })
    .catch(err => console.error('MongoDB connection error:', err));

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: corsOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Make io accessible in routes/controllers
app.set('io', io);

io.on('connection', (socket) => {
    console.log('User connected to socket:', socket.id);
    
    // User joins a room based on their user ID to receive direct notifications
    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their personal room`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
