const mongo = require('mogoose');
const userSchema = new mongo.Schema({
    username:{
        type: String,
        required: [true,'Username is required'],
        unique: [true,'username must be unqiue']
    },
    email:{
        type: String,
        required: [true,'Email is required'],
        unique: [true,'Email must be unique']
    },
    password:{
        type: String,
        required: [true, 'Password must be required']
    }
})

const userModel = mongo.model('users',userSchema);

module.exports = userModel;