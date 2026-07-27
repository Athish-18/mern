import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractTextFromLocalPdf } from './api/utils/pdfExtractor.js';
import { chunkText } from './api/utils/textChunker.js';

const oldChunkText = (text, chunkSize = 800, overlap = 150) => {
  if (!text || typeof text !== 'string') return [];
  const chunks = [];
  let currentIndex = 0;
  while (currentIndex < text.length) {
    const chunk = text.substring(currentIndex, currentIndex + chunkSize).trim();
    if (chunk.length > 0) chunks.push(chunk);
    currentIndex += (chunkSize - overlap);
  }
  return chunks;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const run = async () => {
    console.log("Starting Verification for Phase 1...");
    
    const pdfPath = path.join(__dirname, 'uploads', 'brochures', '1781538924832-857963726.pdf');
    
    console.log(`Extracting text from: ${pdfPath}`);
    const data = await extractTextFromLocalPdf(pdfPath);
    const text = data.text;
    
    console.log(`Extracted ${text.length} characters.`);
    
    console.log("Running old custom chunker...");
    const oldChunks = oldChunkText(text, 800, 150);
    
    console.log("Running new LangChain chunker...");
    const newChunks = await chunkText(text, 800, 150);
    
    console.log("\n--- CHUNKING RESULTS ---");
    console.log(`Old chunk count: ${oldChunks.length}`);
    console.log(`New chunk count: ${newChunks.length}`);
    
    console.log("\n--- COMPARISON (First Chunk) ---");
    console.log("OLD CHUNKER:");
    console.log(oldChunks[0].substring(0, 200) + '...');
    console.log("\nNEW LANGCHAIN CHUNKER:");
    console.log(newChunks[0].substring(0, 200) + '...');
    
    console.log("\n--- COMPARISON (Second Chunk) ---");
    console.log("OLD CHUNKER:");
    console.log(oldChunks[1].substring(0, 200) + '...');
    console.log("\nNEW LANGCHAIN CHUNKER:");
    console.log(newChunks[1].substring(0, 200) + '...');

    process.exit(0);
};

run();
