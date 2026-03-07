const {Router} = require('express');
const authRoute = Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

authRoute.post('/register',authController.registerUser);

authRoute.post('/login',authController.loginUser);

authRoute.post('/get-me',authMiddleware.authUser,authController.getMe);

authRoute.get('/logout',authMiddleware.authUser,authController.logoutUser)

module.exports = authRoute;
