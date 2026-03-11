const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const fs = require("fs/promises");
const id3 = require("node-id3");
const connectToDB = require("../src/config/db");
const songModel = require("../src/models/song.model");

const BASE_URL = process.env.BACKEND_URL || "http://localhost:3000";
const SONGS_ROOT = path.join(__dirname, "..", "public", "songs");
const POSTERS_ROOT = path.join(__dirname, "..", "public", "posters");

const MOOD_FOLDERS = {
  Happy: "happy",
  Sad: "sad",
  Neutral: "neutral",
  Suprised: "suprised",
};

const PLACEHOLDER_NAME = "placeholder.png";
const PLACEHOLDER_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/woAAgMBgH3R1e8AAAAASUVORK5CYII=",
  "base64"
);

const ensurePlaceholder = async () => {
  await fs.mkdir(POSTERS_ROOT, { recursive: true });
  const placeholderPath = path.join(POSTERS_ROOT, PLACEHOLDER_NAME);
  try {
    await fs.access(placeholderPath);
  } catch {
    await fs.writeFile(placeholderPath, PLACEHOLDER_BYTES);
  }
  return `${BASE_URL}/public/posters/${PLACEHOLDER_NAME}`;
};

const safeFileName = (name) =>
  name
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "track";

const buildSongUrl = (folderName, fileName) =>
  `${BASE_URL}/public/songs/${folderName}/${encodeURIComponent(fileName)}`;

const buildPosterUrl = (mood, fileName, mime) => {
  const extension = mime === "image/png" ? ".png" : ".jpg";
  const safeName = safeFileName(fileName);
  const posterFileName = `${safeName}${extension}`;
  const posterDiskPath = path.join(POSTERS_ROOT, mood, posterFileName);
  return { posterFileName, posterDiskPath };
};

async function seed() {
  await connectToDB();

  const placeholderUrl = await ensurePlaceholder();

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const [folderName, mood] of Object.entries(MOOD_FOLDERS)) {
    const moodFolderPath = path.join(SONGS_ROOT, folderName);

    let files = [];
    try {
      files = await fs.readdir(moodFolderPath);
    } catch (error) {
      console.warn(`Missing folder: ${moodFolderPath}`);
      continue;
    }

    for (const fileName of files) {
      if (!fileName.toLowerCase().endsWith(".mp3")) continue;

      const filePath = path.join(moodFolderPath, fileName);
      const songUrl = buildSongUrl(folderName, fileName);

      const existing = await songModel.findOne({ url: songUrl });
      if (existing) {
        skipped += 1;
        continue;
      }

      try {
        const buffer = await fs.readFile(filePath);
        const tags = id3.read(buffer) || {};
        const title = tags.title || path.parse(fileName).name;

        let posterUrl = placeholderUrl;

        if (tags.image?.imageBuffer) {
          const { posterFileName, posterDiskPath } = buildPosterUrl(
            mood,
            fileName,
            tags.image.mime
          );
          await fs.mkdir(path.dirname(posterDiskPath), { recursive: true });
          await fs.writeFile(posterDiskPath, tags.image.imageBuffer);
          posterUrl = `${BASE_URL}/public/posters/${mood}/${posterFileName}`;
        }

        await songModel.create({
          title,
          url: songUrl,
          posterUrl,
          mood,
        });
        created += 1;
      } catch (error) {
        failed += 1;
        console.error(`Failed to seed ${fileName}:`, error.message);
      }
    }
  }

  console.log(
    `Seeding complete. Created: ${created}, Skipped: ${skipped}, Failed: ${failed}`
  );
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
  })
  .finally(() => {
    const mongoose = require("mongoose");
    mongoose.connection.close();
  });
