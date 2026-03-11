const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const authRoute = require('./routes/auth.routes');
const songRoute = require('./routes/songs.routes');

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, '..', 'public')));
app.use('/api/auth',authRoute)
app.use('/api/songs',songRoute)

module.exports = app;
