// controllers/codeController.js

const Generation = require("../models/Generation");
const axios = require("axios");
const extractCodeBlocks = require("../utils/extractCodeBlock");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const generateCode = async (req, res) => {
  const { prompt, sessionId } = req.body;
  const userId = req.user.userId;

  if (!prompt || !sessionId) {
    return res.status(400).json({ error: "Prompt and sessionId are required" });
  }

  try {
    const aiResponse = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-r1-0528-qwen3-8b:free",
        messages: [
          {
            role: "system",
            content: "You are an expert React frontend developer. Respond with clean JSX/TSX and CSS code blocks only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const rawContent = aiResponse.data.choices?.[0]?.message?.content?.trim() || "";
    const blocks = extractCodeBlocks(rawContent);

    const jsxCode = blocks?.tsx || blocks?.jsx || "// No JSX code";
    const cssCode = blocks?.css || "";

    await Generation.create({
      userId,
      sessionId,
      prompt,
      code: jsxCode,
      css: cssCode,
    });

    res.json({ code: jsxCode, css: cssCode });
  } catch (err) {
    console.error("AI generation error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Failed to generate code" });
  }
};

const editCode = async (req, res) => {
  const { prompt, code } = req.body;

  if (!prompt || !code) {
    return res.status(400).json({ error: "Prompt and code are required" });
  }

  try {
    const aiResponse = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-r1-0528-qwen3-8b:free",
        messages: [
          {
            role: "system",
            content: "You are a professional React developer. Respond with updated JSX/TSX and CSS code blocks only.",
          },
          {
            role: "user",
            content: `Here is the code:\n\n${code}\n\nNow, please ${prompt}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const rawContent = aiResponse.data.choices?.[0]?.message?.content?.trim() || "";
    const blocks = extractCodeBlocks(rawContent);

    const editedJsx = blocks?.tsx || blocks?.jsx || "// No edited JSX returned";
    const editedCss = blocks?.css || "";

    res.json({ code: editedJsx, css: editedCss });
  } catch (err) {
    console.error("AI edit error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Failed to edit code" });
  }
};

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
    res.status(500).json({ error: "Failed to fetch generation history" });
  }
};

module.exports = {
  generateCode,
  editCode,
  getGenerations,
};
