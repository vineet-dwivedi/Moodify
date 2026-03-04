const mongo = require('mongoose');
async function connectToDB(){
    await mongo.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log('Connected To DB');
    }).catch(err=>{
        console.log('Error Conneccting to DB');
    })
}

module.exports = connectToDB;