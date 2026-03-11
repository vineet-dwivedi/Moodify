# Moodify

Moodify is a full stack face-expression music player. It detects a user's facial expression in real time and plays a matching track for the current mood. The UI is animated, mood-reactive, and includes a theme toggle.

## Features
- Real-time face expression detection with camera input
- Mood-based song selection and autoplay
- Animated, moody UI with theme toggle and responsive layout
- Auth with JWT cookies and protected routes
- Backend seeding from local mood folders

## Supported Moods
- happy
- sad
- neutral
- suprised

## Tech Stack
- React + Vite + Sass
- Node.js + Express
- MongoDB + Mongoose
- MediaPipe Tasks Vision
- Redis (token blacklist)
- ImageKit (optional uploads)

## Project Structure
- `Moodify/` frontend app
- `Moodify-Backend/` backend API

## Setup
1. Install frontend dependencies.
```bash
cd Moodify
npm install
```
2. Install backend dependencies.
```bash
cd ../Moodify-Backend
npm install
```
3. Create `Moodify-Backend/.env` with your own values.
```env
MONGO_URI=your_mongodb_connection_string
JWT_KEY=your_jwt_secret
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
REDIS_USERNAME=your_redis_user
REDIS_PASSWORD=your_redis_password
IMAGE_KIT_PRIVATE_KEY=your_imagekit_private_key
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```
4. Start the backend.
```bash
cd Moodify-Backend
npm run dev
```
5. Start the frontend.
```bash
cd ../Moodify
npm run dev
```

## Seed Songs From Local Folders
Place MP3 files inside:
- `Moodify-Backend/public/songs/Happy`
- `Moodify-Backend/public/songs/Sad`
- `Moodify-Backend/public/songs/Neutral`
- `Moodify-Backend/public/songs/Suprised`

Then run:
```bash
cd Moodify-Backend
node scripts/seedSongs.js
```

This script extracts ID3 metadata, creates posters in `Moodify-Backend/public/posters`, and inserts records into MongoDB.

## API Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/get-me`
- `GET /api/auth/logout`
- `GET /api/songs?mood=happy`
- `POST /api/songs` (multipart upload)

## Notes
- Camera access is required for expression detection.
- Autoplay may be blocked by the browser until user interaction.

## License And Author
MIT
Author : Vineet Dwivedi
