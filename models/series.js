const mongoose = require('mongoose');

const seriesSchema = mongoose.Schema({
    id: {
        type: String,
        required: 'seriesid is required',
        index: true,
        unique: true
    },
    series: {
        start_date: {
            type: String,
        },
        end_date: {
            type: String,
        },
        name: {
            type: String,
        },
        series_category: {
            type: String
        },
        id: {
            type: String,
            required: 'seriesid is required',
        }
    },
    tabs: [{
        id: {
            type: String,
        },
        header: {
            type: String,
        },
        url: {
            type: String,
        },
        default: {
            type: String,
        },
    }]
}, {timestamps: true});

module.exports = mongoose.model('Series', seriesSchema);