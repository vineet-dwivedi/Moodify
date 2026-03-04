const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function registerUser(req,res){
    const {username,email,password} = req.body;
    const isAlreadyRegister = await userModel.findOne({
        $or:[
            {email},{username}
        ]
    })

    if(isAlreadyRegister){
        return res.status(400).json({
            message:'User already exsist'
        })
    }

    const hash = await bcrypt.hash(password,10);

    const user = await userModel.create({
        username,
        email,
        password: hash
    })

    const token = jwt.sign({
        id:user._id,
        username: user.username
    },process.env.JWT_KEY, {expiresIn: '7d'})

    req.cookie('token',token)
    return res.status(201).json({
        message: 'User register successfully.',
        user:{
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}

async function loginUser(req,res) {
    const{email,password,username} = req.body;
    const user = await userModel.findOne({$or:[{email},{username}]
    })

    if(!user){
        return res.status(400).json({
            message: 'Invalid Credentials'
        })
    }

    const isPasswordValid = await bcrypt.compare(password,user.password)

    if(!isPasswordValid){
        return res.status(400).json({
            message: 'Invalid credentials'
        })
    }

    const token = jwt.sign({
        id:user._id,
        username: user.username
    },process.env.JWT_KEY,{expiresIn: '7d'})

    res.cookkie('token',token)

    return res.status(200).json({
        message: 'User logged in successfully',
        user:{
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}

module.exports = {registerUser,loginUser}