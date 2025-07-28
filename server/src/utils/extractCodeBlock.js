// utils/extractCodeBlock.js

function extractCodeBlocks(text) {
  console.log('🔍 Extracting code blocks from text:', text.substring(0, 200) + '...');
  
  const blocks = {};
  
  // Try multiple regex patterns for code block extraction
  const patterns = [
    /```([a-zA-Z]+)?\r?\n([\s\S]*?)```/g, // Standard with optional language
    /```([a-zA-Z]+)\r?\n([\s\S]*?)```/g,  // Must have language
    /```\r?\n([\s\S]*?)```/g,              // No language specified
  ];
  
  let foundBlocks = false;
  
  for (const regex of patterns) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      foundBlocks = true;
      let lang, code;
      
      if (match.length === 3) {
        // Pattern with language
        lang = (match[1] || "unknown").toLowerCase();
        code = match[2].trim();
      } else {
        // Pattern without language - guess from content
        code = match[1].trim();
        lang = guessLanguage(code);
      }
      
      // Normalize language names
      if (lang === 'js' || lang === 'javascript' || lang === 'tsx' || lang === 'typescript') {
        lang = 'jsx';
      }
      
      console.log(`📝 Found ${lang} block:`, code.substring(0, 100) + '...');
      
      if (!blocks[lang]) {
        blocks[lang] = code;
      } else {
        // Append if duplicate language blocks exist
        blocks[lang] += "\n\n" + code;
      }
    }
    
    if (foundBlocks) break; // Stop if we found blocks with this pattern
  }
  
  // If no code blocks found, try to extract JSX/React code heuristically
  if (!foundBlocks) {
    console.log('⚠️ No code blocks found, trying heuristic extraction...');
    const jsxMatch = text.match(/(import.*react.*|function.*\{[\s\S]*return.*\([\s\S]*\<[\s\S]*\>[\s\S]*\);?[\s\S]*\}|const.*=.*\([\s\S]*\<[\s\S]*\>[\s\S]*\))/i);
    if (jsxMatch) {
      blocks.jsx = jsxMatch[0].trim();
      console.log('🎯 Extracted JSX heuristically:', blocks.jsx.substring(0, 100) + '...');
    }
    
    const cssMatch = text.match(/(\.\w+[\s\S]*\{[\s\S]*\}|\w+[\s\S]*\{[\s\S]*\})/g);
    if (cssMatch) {
      blocks.css = cssMatch.join('\n\n').trim();
      console.log('🎨 Extracted CSS heuristically:', blocks.css.substring(0, 100) + '...');
    }
  }
  
  console.log('✅ Final extracted blocks:', Object.keys(blocks));
  return Object.keys(blocks).length ? blocks : null;
}

// Helper function to guess language from code content
function guessLanguage(code) {
  if (code.includes('import') && (code.includes('React') || code.includes('useState') || code.includes('<'))) {
    return 'jsx';
  }
  if (code.includes('function') && code.includes('<') && code.includes('>')) {
    return 'jsx';
  }
  if (code.includes('{') && code.includes('}') && (code.includes('color:') || code.includes('background:') || code.includes('font-'))) {
    return 'css';
  }
  return 'jsx'; // Default to JSX for unknown
}

module.exports = extractCodeBlocks;
