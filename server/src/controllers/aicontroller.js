const Generation = require('../models/Generation');
const axios = require('axios');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// POST /api/generate - Generate new code
const generateCode = async (req, res) => {
  const { prompt, sessionId } = req.body;
  const userId = req.user.userId;

  if (!prompt || !sessionId) {
    return res.status(400).json({ error: 'Prompt and sessionId are required' });
  }

  try {
    const aiResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
        messages: [
          {
            role: 'system',
            content: 'You are an expert frontend developer. Generate high-quality, clean, readable React component code.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const code = aiResponse.data.choices?.[0]?.message?.content?.trim() || '// No code generated';

    await Generation.create({
      userId,
      sessionId,
      prompt,
      code,
    });

    res.json({ code });
  } catch (err) {
    console.error('AI generation error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to generate code' });
  }
};

// POST /api/edit - Edit existing code
const editCode = async (req, res) => {
  const { prompt, code } = req.body;

  if (!prompt || !code) {
    return res.status(400).json({ error: 'Prompt and code are required' });
  }

  try {
    const aiResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
        messages: [
          {
            role: 'system',
            content: 'You are a professional React developer. Modify the provided code based on user instructions.',
          },
          {
            role: 'user',
            content: `Here is the code:\n\n${code}\n\nNow, please ${prompt}`,
          },
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const editedCode = aiResponse.data.choices?.[0]?.message?.content?.trim() || '// No edited code returned';

    res.json({ code: editedCode });
  } catch (err) {
    console.error('AI edit error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to edit code' });
  }
};

// GET /api/history - Load generations for a specific session
const getGenerations = async (req, res) => {
  const { sessionId } = req.query;

  try {
    const query = { userId: req.user.userId };
    if (sessionId) {
      query.sessionId = sessionId;
    }

    const generations = await Generation.find(query).sort({ createdAt: -1 });
    res.json({ generations });
  } catch (err) {
    console.error("Error fetching generations:", err);
    res.status(500).json({ error: 'Failed to fetch generation history' });
  }
};

module.exports = {
  generateCode,
  editCode,
  getGenerations,
};
