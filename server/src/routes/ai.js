const express = require('express');
const router = express.Router();
const { generateCode,editCode,getGenerations } = require('../controllers/aicontroller');
const authenticate = require('../middleware/auth');

router.post('/generate', authenticate, generateCode);
router.post('/edit', authenticate, editCode);
router.get('/history', authenticate, getGenerations)
module.exports = router;