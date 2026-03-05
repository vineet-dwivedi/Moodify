const mongo = require('mongoose');
const { registerUser, loginUser } = require('../controllers/auth.controller');
const blacklistSchema = new mongo.Schema({
    token:{
        type: String,
        required: [true,'token is required for blacklisting']
    }
},{
    timestamps: true
})

const blacklistModel = mongo.model('blacklist',blacklistSchema)

module.exports = blacklistModel;