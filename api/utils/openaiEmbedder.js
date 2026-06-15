import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

// Delay initialization to prevent the entire Express server from crashing on boot
let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export const generateEmbeddings = async (chunks) => {
  if (!openai) {
    throw new Error("Cannot generate embeddings: OPENAI_API_KEY is missing from your .env file!");
  }

  if (!chunks || chunks.length === 0) return [];
  
  try {
    // Send all chunks in a single batch request for maximum performance
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunks,
    });
    
    // response.data is an array of objects aligned with the input chunks array
    // We map it to return just the flat arrays of numbers
    return response.data.map(item => item.embedding);
  } catch (error) {
    throw new Error(`OpenAI Embedding Error: ${error.message}`);
  }
};
