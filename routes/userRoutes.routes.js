const express = require('express');
const router = express.Router();
const {validateCredentials, Signup, Profile} = require('./controllers/users.js');

router.post('/login', validateCredentials);
router.post('/signup', Signup);
router.post('/videos', Profile);

module.exports = router;