const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    name: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    images: {
        type: Array,
        default: [{
            url: 'https://via.placeholder.com/150x150.png?text=profile',
            public_id: Date.now()
        }]
    },
    about: {
        type: String
    }
    // the timestamps true flag automatically adds createdAt and modifiedAt fields
}, {timestamps: true});

module.exports = mongoose.model('User', userSchema);

