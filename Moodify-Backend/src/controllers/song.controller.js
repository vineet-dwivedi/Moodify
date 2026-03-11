const songModel = require("../models/song.model");
const id3 = require("node-id3");
const storageService = require("../services/storage.service");

async function uploadSongController(req,res){
    
    const songBuffer = req.file.buffer;

    const {mood} = req.body

    const tags = id3.read(songBuffer);

    const [songFile,posterFile] = await Promise.all([
        storageService.uploadFile({
        buffer: songBuffer,
        filename: tags.title,
        folder: '/Moodify-Songs'
    }),
        storageService.uploadFile({
        buffer: tags.image.imageBuffer,
        filename: tags.title + ".jpeg",
        folder: "/Moodify-Songs/Poster"
    })
]);

    const song = await songModel.create({
        title:tags.title,
        url:songFile.url,
        posterUrl:posterFile.url,
        mood
    })

    res.status(201).json({
        message:"Song created successfully",
        song
    })

}

async function getSongController(req,res) {
    const {mood} = req.query;
    if (!mood) {
        return res.status(400).json({
            message: 'Mood is required'
        })
    }

    const total = await songModel.countDocuments({ mood });
    if (!total) {
        return res.status(200).json({
            message: 'No songs found for this mood',
            song: null
        })
    }

    const randomSkip = Math.floor(Math.random() * total);
    const song = await songModel.findOne({ mood }).skip(randomSkip);

    res.status(200).json({
        message: 'Song fetched successfully',
        song
    })
}

module.exports = {uploadSongController,getSongController}
