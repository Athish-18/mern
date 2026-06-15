export const chunkText = (text, chunkSize = 800, overlap = 150) => {
  if (!text || typeof text !== 'string') return [];
  
  const chunks = [];
  let currentIndex = 0;
  
  while (currentIndex < text.length) {
    // Slice the string from current index up to the chunk size
    const chunk = text.substring(currentIndex, currentIndex + chunkSize).trim();
    
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    
    // Move forward by chunkSize MINUS overlap, meaning the next chunk
    // will start 150 characters BEFORE the end of this current chunk.
    currentIndex += (chunkSize - overlap);
  }
  
  return chunks;
};
