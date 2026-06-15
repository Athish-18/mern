import mongoose from 'mongoose';
import BrochureChunk from '../models/brochureChunk.model.js';

export const semanticSearch = async (queryEmbedding, listingRef, limit = 5) => {
  try {
    // Construct the MongoDB Atlas Vector Search aggregation pipeline
    const pipeline = [
      {
        $vectorSearch: {
          index: "brochure_vector_index", // Name of the Atlas index
          path: "embedding",              // Field containing the vector
          queryVector: queryEmbedding,    // The question's embedding array
          numCandidates: limit * 10,      // Scan pool size (improves recall)
          limit: limit,                   // Final number of documents to return
          filter: {                       // Pre-filter to strictly isolate by property
            listingRef: new mongoose.Types.ObjectId(listingRef)
          }
        }
      },
      {
        // Project only the required fields and append the exact similarity score
        $project: {
          _id: 0,
          text: 1,
          chunkIndex: 1,
          brochureRef: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
    ];

    const matches = await BrochureChunk.aggregate(pipeline);
    return matches;
  } catch (error) {
    throw new Error(`Atlas Vector Search Error: ${error.message}`);
  }
};
