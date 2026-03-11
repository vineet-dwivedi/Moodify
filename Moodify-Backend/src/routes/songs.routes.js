const express = require('express');
const multer = require('multer');
const upload = require('../middleware/upload.middleware');
const { uploadSongController,getSongController } = require('../controllers/song.controller');
const songRoute = express.Router();
uploadSongController

songRoute.post('/',upload.single('song'),uploadSongController);
songRoute.get('/',getSongController);

module.exports = songRoute;