const {Router} = require('express');
const authRoute = Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

authRoute.post('/register',authMiddleware.authUser,authController.registerUser);

authRoute.post('/login',authMiddleware.authUser,authController.loginUser);

authRoute.post('/get-me',authMiddleware.authUser,authController.getMe);

authRoute.get('/logout',authController.logoutUser)

module.exports = authRoute;