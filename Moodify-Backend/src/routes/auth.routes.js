const {Router} = require('express');
const authRoute = Router();
const authController = require('../controllers/auth.controller');

authRoute.post('/register',authController.registerUser);

authRoute.post('/login',authController.loginUser);

module.exports = authRoute;