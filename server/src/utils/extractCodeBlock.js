// utils/extractCodeBlock.js

function extractCodeBlocks(text) {
  const regex = /```([a-zA-Z]+)?\n([\s\S]*?)```/g;
  const blocks = {};
  let match;

  while ((match = regex.exec(text)) !== null) {
    const lang = (match[1] || "unknown").toLowerCase();
    const code = match[2].trim();

    if (!blocks[lang]) {
      blocks[lang] = code;
    } else {
      // Append if duplicate language blocks exist (e.g. multiple `css` sections)
      blocks[lang] += "\n\n" + code;
    }
  }

  return Object.keys(blocks).length ? blocks : null;
}

module.exports = extractCodeBlocks;
