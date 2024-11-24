const express = require('express');
const router = express.Router();
const {getMyVideos, getOtherVideos} = require('./controllers/videos.js');

router.post('/getMyVideos', getMyVideos);
router.post('/getOtherVideos', getOtherVideos);

module.exports = router;