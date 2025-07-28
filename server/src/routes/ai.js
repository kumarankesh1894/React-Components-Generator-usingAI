const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { generateCode,editCode,getGenerations } = require('../controllers/aicontroller');
const autoSaveService = require('../services/autoSaveService');
const authenticate = require('../middleware/auth');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  }
});

router.post('/generate', authenticate, upload.array('images', 5), generateCode);
router.post('/edit', authenticate, editCode);
router.get('/history', authenticate, getGenerations);

// Autosave routes
router.post('/autosave', authenticate, async (req, res) => {
  try {
    const { sessionId, prompt, code, css, chatMessages, expandedSection } = req.body;
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Prepare the state update object with correct key names expected by autoSaveService
    const stateUpdate = {
      currentPrompt: prompt || '',
      currentCode: code || '',
      currentCSS: css || '',
      chatHistory: chatMessages || [],
      expandedSection: expandedSection || null
    };

    // Use autosave service to save the session state with correct parameters
    await autoSaveService.autoSave(userId, sessionId, stateUpdate);

    res.json({ success: true, message: 'Session auto-saved successfully' });
  } catch (error) {
    console.error('Autosave error:', error);
    res.status(500).json({ error: 'Failed to auto-save session' });
  }
});

router.get('/autosave/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Retrieve session state using autosave service
    const sessionData = await autoSaveService.getSessionState(userId, sessionId);

    if (!sessionData) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      data: {
        sessionId: sessionData.sessionId,
        prompt: sessionData.prompt || '',
        code: sessionData.code || '',
        css: sessionData.css || '',
        chatMessages: sessionData.chatMessages || [],
        expandedSection: sessionData.expandedSection || null,
        lastUpdated: sessionData.lastUpdated
      }
    });
  } catch (error) {
    console.error('Get autosave error:', error);
    res.status(500).json({ error: 'Failed to retrieve session data' });
  }
});

module.exports = router;
