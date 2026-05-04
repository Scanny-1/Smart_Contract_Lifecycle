const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        enum: ['Legal Head', 'Financial Head', 'Manager', 'Admin']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Role', roleSchema);
