const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'username cannot be blank']
    },
    codeforces: {
        type: String,
        required: [true, 'codeforces id required']
    },
    password: {
        type: String,
        required: [true, 'password cannot be blank']
    },
    track: [
        {
            codeforces: String,
            rating: Number,
            maxRating: Number,
            img: String,
            diff: Number

        }
    ],
    lastUserChecked: String,
});

module.exports = mongoose.model('User', userSchema)