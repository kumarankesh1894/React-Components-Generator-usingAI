// controllers/aicontroller.js

const Generation = require("../models/Generation");
const axios = require("axios");
const extractCodeBlocks = require("../utils/extractCodeBlock");
const autoSaveService = require("../services/autoSaveService");
const fs = require('fs');
const path = require('path');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// List of reliable models for code generation
// Only using proven stable models
const FALLBACK_MODELS = [
  "deepseek/deepseek-r1-0528:free", // DeepSeek R1 - Primary choice for code generation
  "google/gemini-2.5-pro-exp-03-25", // Reliable fallback
  "qwen/qwen3-coder:free", // Additional stable fallback
];

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to call Gemini API
const callGeminiAPI = async (messages) => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  try {
    console.log('🧠 Calling Gemini API...');
    
    // Convert messages to Gemini format
    const geminiMessages = messages.filter(msg => msg.role !== 'system').map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
    
    // Add system instruction as part of the first user message if present
    const systemMessage = messages.find(msg => msg.role === 'system');
    if (systemMessage && geminiMessages.length > 0) {
      geminiMessages[0].parts[0].text = systemMessage.content + '\n\n' + geminiMessages[0].parts[0].text;
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: geminiMessages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000
      }
    );

    const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error('No content received from Gemini API');
    }

    console.log('✅ Gemini API call successful');
    
    // Return in OpenRouter-compatible format
    return {
      data: {
        choices: [{
          message: {
            content: content
          }
        }]
      }
    };
  } catch (error) {
    console.error('❌ Gemini API error:', error?.response?.data || error.message);
    throw error;
  }
};

// Function to try multiple models with retry logic
const tryModelsSequentially = async (messages, modelList = FALLBACK_MODELS) => {
  for (let i = 0; i < modelList.length; i++) {
    const model = modelList[i];
    
    // Try each model up to 3 times with exponential backoff
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Trying model: ${model} (attempt ${attempt}/3)`);
        
        const response = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: model,
            messages: messages,
            max_tokens: 4000,
            temperature: 0.7
          },
          {
            headers: {
              Authorization: `Bearer ${OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
            },
            timeout: 30000 // 30 second timeout
          }
        );
        
        console.log(`✅ Success with model: ${model} on attempt ${attempt}`);
        return response;
      } catch (error) {
        const errorMessage = error?.response?.data?.error?.message || error.message;
        const statusCode = error?.response?.status;
        
        console.log(`❌ Failed with model ${model} (attempt ${attempt}/3):`, errorMessage);
        
        // Handle different types of errors
        const isRetryableError = (
          statusCode === 502 || 
          errorMessage.includes('502') || 
          errorMessage.includes('timeout') ||
          errorMessage.includes('Provider returned error')
        );
        
        const isRateLimit = (
          statusCode === 429 ||
          errorMessage.includes('Rate limit exceeded') ||
          errorMessage.includes('limited to')
        );
        
        const isModelUnavailable = (
          errorMessage.includes('No endpoints found') ||
          errorMessage.includes('model not found')
        );
        
        // Skip retries for unavailable models
        if (isModelUnavailable) {
          console.log(`⚠️ Model ${model} is not available, skipping to next model`);
          break;
        }
        
        // For rate limits, wait longer before retry
        if (isRateLimit && attempt < 3) {
          const delay = 60000; // Wait 1 minute for rate limits
          console.log(`⏳ Rate limited on ${model}, waiting ${delay/1000}s before retry...`);
          await wait(delay);
          continue;
        }
        
        // For other retryable errors, use exponential backoff
        if (isRetryableError && attempt < 3) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
          console.log(`⏳ Retrying ${model} in ${delay}ms...`);
          await wait(delay);
          continue;
        }
        
        // If all attempts failed for this model, try next model
        if (attempt === 3) {
          console.log(`🚫 All attempts failed for model: ${model}`);
          break;
        }
      }
    }
    
    // If this is the last model and all attempts failed, throw error
    if (i === modelList.length - 1) {
      throw new Error('All models failed after multiple attempts');
    }
  }
};

// Emergency fallback function when all models fail
const getEmergencyFallback = (prompt) => {
  console.log('🚨 Using emergency fallback response');
  
  // Analyze prompt to provide appropriate fallback
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('countdown') || lowerPrompt.includes('timer')) {
    return {
      jsx: `import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ initialMinutes = 5 }) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  
  useEffect(() => {
    if (timeLeft === 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return \`\${mins.toString().padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`;
  };
  
  return (
    <div className="countdown-timer">
      <div className="timer-display">
        {formatTime(timeLeft)}
      </div>
      <button onClick={() => setTimeLeft(initialMinutes * 60)} className="reset-btn">
        Reset
      </button>
    </div>
  );
};

export default CountdownTimer;`,
      css: `.countdown-timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px;
  color: white;
  font-family: 'Arial', sans-serif;
  max-width: 300px;
  margin: 0 auto;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.timer-display {
  font-size: 4rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.reset-btn {
  background: rgba(255,255,255,0.2);
  border: 2px solid rgba(255,255,255,0.3);
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reset-btn:hover {
  background: rgba(255,255,255,0.3);
  transform: translateY(-2px);
}`
    };
  }
  
  if (lowerPrompt.includes('button')) {
    return {
      jsx: `import React from 'react';

const ModernButton = ({ children, onClick, variant = 'primary', size = 'medium' }) => {
  return (
    <button 
      className={\`modern-btn modern-btn--\${variant} modern-btn--\${size}\`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default ModernButton;`,
      css: `.modern-btn {
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
  outline: none;
}

.modern-btn--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.modern-btn--secondary {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
}

.modern-btn--small {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.modern-btn--medium {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

.modern-btn--large {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}

.modern-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.modern-btn:active {
  transform: translateY(0);
}`
    };
  }
  
  // Default generic component
  return {
    jsx: `import React from 'react';

const GenericComponent = () => {
  return (
    <div className="generic-component">
      <h2>Component Generated</h2>
      <p>This is a basic React component created as a fallback.</p>
      <p>Please try again when the AI service is available.</p>
    </div>
  );
};

export default GenericComponent;`,
    css: `.generic-component {
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  text-align: center;
  font-family: Arial, sans-serif;
}

.generic-component h2 {
  color: #495057;
  margin-bottom: 1rem;
}

.generic-component p {
  color: #6c757d;
  margin-bottom: 0.5rem;
}`
  };
};

// Helper function to convert image file to base64
const convertImageToBase64 = (filePath) => {
  const imageBuffer = fs.readFileSync(filePath);
  const base64String = imageBuffer.toString('base64');
  return base64String;
};

// Helper function to get image MIME type
const getImageMimeType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  return mimeTypes[ext] || 'image/jpeg';
};

const generateCode = async (req, res) => {
  const { prompt, sessionId } = req.body;
  const userId = req.user.userId;
  const uploadedImages = req.files; // Multer files

  if ((!prompt || prompt.trim() === '') && (!uploadedImages || uploadedImages.length === 0)) {
    return res.status(400).json({ error: "Either prompt or images are required" });
  }

  if (!sessionId) {
    return res.status(400).json({ error: "SessionId is required" });
  }

  try {
    let messages = [];
    let modelToUse = "meta-llama/llama-3.2-3b-instruct:free"; // More reliable free model

    // System message
    messages.push({
      role: "system",
      content: `You are an expert React frontend developer. Create high-quality, functional React components with proper styling.

Rules:
1. Always provide complete, working JSX/TSX code wrapped in \`\`\`jsx or \`\`\`tsx code blocks
2. Include corresponding CSS code in \`\`\`css code blocks
3. Use modern React patterns (hooks, functional components)
4. Include proper component structure with imports, exports, and props
5. Add responsive design and modern styling
6. Ensure components are production-ready with error handling where appropriate
7. Use semantic HTML elements and proper accessibility attributes

Example format:
\`\`\`jsx
// Your JSX code here
\`\`\`

\`\`\`css
/* Your CSS code here */
\`\`\`

Focus on creating clean, maintainable, and visually appealing components.`
    });

    // Handle images if present
    if (uploadedImages && uploadedImages.length > 0) {
      console.log(`Processing ${uploadedImages.length} images with text-based fallback`);
      
      // For now, use text-based approach since vision models need paid credits
      let imagePrompt = prompt || "";
      
      // Add context about uploaded images
      imagePrompt += `\n\n[Note: User has uploaded ${uploadedImages.length} image(s) as reference. `;
      imagePrompt += `Please create a modern, responsive React component based on the description provided. `;
      imagePrompt += `If no specific description is given, create a clean, professional UI component with proper styling.]`;
      
      // If no text prompt provided, give a generic UI generation instruction
      if (!prompt || !prompt.trim()) {
        imagePrompt = "Create a modern, responsive React component with clean styling. Include appropriate props, state management if needed, and CSS for a professional appearance. Make it visually appealing with good UX practices.";
      }

      messages.push({
        role: "user",
        content: imagePrompt
      });

      // Clean up uploaded files
      uploadedImages.forEach(image => {
        try {
          fs.unlinkSync(image.path);
        } catch (err) {
          console.error('Error deleting uploaded file:', err);
        }
      });
    } else {
      // Text-only prompt
      messages.push({
        role: "user",
        content: prompt
      });
    }

    let jsxCode, cssCode;
    
    try {
      // Try models with fallback system
      const aiResponse = await tryModelsSequentially(messages);
      const rawContent = aiResponse.data.choices?.[0]?.message?.content?.trim() || "";
      const blocks = extractCodeBlocks(rawContent);
      
      jsxCode = blocks?.tsx || blocks?.jsx || "// No JSX code";
      cssCode = blocks?.css || "";
    } catch (fallbackError) {
      console.log('🚨 All AI models failed, using emergency fallback');
      // Use emergency fallback
      const fallbackResponse = getEmergencyFallback(prompt || 'generic component');
      jsxCode = fallbackResponse.jsx;
      cssCode = fallbackResponse.css;
    }

    const generation = await Generation.create({
      userId,
      sessionId,
      prompt: prompt || "Image-based generation",
      code: jsxCode,
      css: cssCode,
    });

    // Auto-save session state with the new generation
    try {
      await autoSaveService.autoSave(sessionId, userId, {
        currentCode: jsxCode,
        currentCSS: cssCode,
        currentPrompt: prompt || "Image-based generation",
        expandedSection: 'preview' // Default to preview after generation
      });
      
      // Add to chat history using saveChatMessage
      await autoSaveService.saveChatMessage(
        sessionId,
        userId,
        'user',
        prompt || "Image upload",
        jsxCode // Associate the generated code with the user message
      );
      
      await autoSaveService.saveChatMessage(
        sessionId,
        userId,
        'assistant',
        'Generated React component successfully',
        null // No code associated with assistant response
      );
      
      console.log(`✅ Auto-saved session state for session: ${sessionId}`);
    } catch (autoSaveError) {
      console.error('❌ Auto-save failed:', autoSaveError);
      // Don't fail the request if auto-save fails
    }

    res.json({ code: jsxCode, css: cssCode });
  } catch (err) {
    console.error("AI generation error:", err?.response?.data || err.message);
    
    // Clean up files in case of error
    if (uploadedImages) {
      uploadedImages.forEach(image => {
        try {
          fs.unlinkSync(image.path);
        } catch (cleanupErr) {
          console.error('Error cleaning up file:', cleanupErr);
        }
      });
    }
    
    res.status(500).json({ error: "Failed to generate code" });
  }
};

const editCode = async (req, res) => {
  const { prompt, code } = req.body;

  if (!prompt || !code) {
    return res.status(400).json({ error: "Prompt and code are required" });
  }

  try {
    const messages = [
      {
        role: "system",
        content: "You are a professional React developer. Respond with updated JSX/TSX and CSS code blocks only.",
      },
      {
        role: "user",
        content: `Here is the code:\n\n${code}\n\nNow, please ${prompt}`,
      },
    ];
    
    const aiResponse = await tryModelsSequentially(messages);

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
