const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');

async function authUser(req,res,next){
    const token = req.cookies.token;
    if(!token){
        return res.status(401).json({
            message:'Token not provided'
        })
    }

    let decode;

    try{
        decode = jwt.verify(token,process.env.JWT_KEY)
        req.user = decode;
        next();
    }catch(err){
        return res.status(401).json({
            message: 'Invalid token'
        })
    }
}

module.exports = { authUser }