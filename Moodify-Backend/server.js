require('dotenv').config()
require('./src/config/cache')
const app = require('./src/app');
const connectToDB = require('./src/config/db')
const PORT = 3000;

connectToDB();
app.listen(PORT,()=>{
    console.log(`Server is running on this ${PORT}!!`);
})
