function extractCodeBlocks(text) {
  const regex = /```[a-z]*\n([\s\S]*?)```/g;
  const match = regex.exec(text);
  return match ? match[1].trim() : null;
}

module.exports = extractCodeBlocks;
