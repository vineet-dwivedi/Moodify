const Redis = require('ioredis').default;

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD
})

redis.on('connect',()=>{
    console.log('Server is connected to Redis')
})

redis.on('error', (err) => console.error('Redis error:', err.message))

module.exports = redis;
