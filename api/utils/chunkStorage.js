import BrochureChunk from '../models/brochureChunk.model.js';

export const saveChunks = async (chunks, embeddings, brochureRef, listingRef, category) => {
  try {
    if (!chunks || chunks.length === 0) return [];

    // Map raw strings into Mongoose document objects
    const chunkDocs = chunks.map((text, index) => ({
      brochureRef,
      listingRef,
      category,
      text,
      pageNumber: 1, // Temporary placeholder until advanced PDF parsing maps exact pages
      chunkIndex: index,
      embedding: embeddings[index], // Array of 1536 floats from OpenAI
    }));

    // Use insertMany for massive performance gains over saving in a loop
    const savedChunks = await BrochureChunk.insertMany(chunkDocs);
    return savedChunks;
  } catch (error) {
    throw new Error(`Chunk Storage Error: ${error.message}`);
  }
};
