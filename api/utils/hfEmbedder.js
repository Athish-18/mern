import { pipeline } from '@xenova/transformers';

// Lazy-load the model to prevent the Express server from blocking during boot
let embedder = null;

export const generateEmbeddings = async (chunks) => {
  if (!chunks || chunks.length === 0) return [];
  
  try {
    if (!embedder) {
      console.log("\n[HuggingFace] Loading all-MiniLM-L6-v2 locally...");
      console.log("[HuggingFace] (This will take ~30 seconds on the very first run to download the ONNX model)");
      // Initialize the feature extraction pipeline
      embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log("[HuggingFace] Model loaded successfully!\n");
    }

    const embeddings = [];
    
    console.log(`[HuggingFace] Generating embeddings for ${chunks.length} chunks...`);
    // Process each chunk locally
    for (const chunk of chunks) {
      // pooling: 'mean' and normalize: true are standard for sentence embeddings
      const output = await embedder(chunk, { pooling: 'mean', normalize: true });
      
      // The output is a Tensor object. We convert its raw data back to a standard JS Array
      embeddings.push(Array.from(output.data));
    }
    
    return embeddings;
  } catch (error) {
    throw new Error(`HuggingFace Local Embedding Error: ${error.message}`);
  }
};
