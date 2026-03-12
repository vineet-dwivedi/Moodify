const multer = require('multer');
const storage = multer .memoryStorage();

const upload = multer({
    storage: storage,
    limits:{
        fileSize: 1024*1024*150 //15MB
    }
})

module.exports = upload;