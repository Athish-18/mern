import Brochure from '../models/brochure.model.js';
import { extractTextFromLocalPdf } from '../utils/pdfExtractor.js';
import { chunkText } from '../utils/textChunker.js';
import { saveChunks } from '../utils/chunkStorage.js';
import { generateEmbeddings } from '../utils/hfEmbedder.js'; // Swapped to HuggingFace
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

export const createBrochure = async (req, res, next) => {
  try {
    const { title, category, listingRef } = req.body;

    if (!title || !category || !listingRef || !req.file) {
      const error = new Error('Title, category, listingRef, and a PDF file are required');
      error.statusCode = 400;
      return next(error);
    }

    const localPath = req.file.path;
    const fileUrl = `/uploads/brochures/${req.file.filename}`;
    const originalFileName = req.file.originalname;

    const newBrochure = new Brochure({
      title,
      category,
      listingRef,
      localPath,
      fileUrl,
      originalFileName,
      uploadedBy: req.user.id,
      vectorized: false,
    });

    const savedBrochure = await newBrochure.save();

    // Send immediate response to the client
    res.status(201).json({
      id: savedBrochure._id,
      title: savedBrochure.title,
      category: savedBrochure.category,
      listingRef: savedBrochure.listingRef,
      fileUrl: savedBrochure.fileUrl,
      vectorized: savedBrochure.vectorized,
    });

    // Fire-and-forget: Extract PDF text in the background for verification
    extractTextFromLocalPdf(savedBrochure.localPath)
      .then(async (data) => {
        try {
          // 1. Chunk the extracted text
          const chunks = await chunkText(data.text, 800, 150);
          
          if (chunks.length === 0) throw new Error("No text was extracted to chunk.");

          // 2. Generate Embeddings via Local HuggingFace Model
          const embeddings = await generateEmbeddings(chunks);

          // 3. Save chunks and embeddings to MongoDB
          await saveChunks(chunks, embeddings, savedBrochure._id, savedBrochure.listingRef, savedBrochure.category);

          // 4. Mark the Brochure as fully vectorized!
          savedBrochure.vectorized = true;
          await savedBrochure.save();

          // Logging Requirements
          console.log(`\n======================================`);
          console.log(`✅ VECTORIZATION COMPLETE`);
          console.log(`Brochure Title:     ${savedBrochure.title}`);
          console.log(`Total Chunks:       ${chunks.length}`);
          console.log(`Embedding Provider: HuggingFace (all-MiniLM-L6-v2)`);
          console.log(`Dimensions:         ${embeddings[0].length}`);
          console.log(`Total Vectors Gen:  ${embeddings.length}`);
          console.log(`======================================\n`);

        } catch (pipelineErr) {
          console.error(`\n======================================`);
          console.error(`❌ VECTORIZATION FAILED`);
          console.error(`Brochure Title: ${savedBrochure.title}`);
          console.error(`Reason:         ${pipelineErr.message}`);
          console.error(`======================================\n`);
        }
      })
      .catch(err => {
        console.error(`\n======================================`);
        console.error(`❌ PDF EXTRACTION FAILED`);
        console.error(`Brochure Title: ${savedBrochure.title}`);
        console.error(`Reason:         ${err.message}`);
        console.error(`Likely causes:`);
        console.error(`  1. The PDF is password protected.`);
        console.error(`  2. The PDF is just scanned images (requires OCR, pdf-parse only reads text layers).`);
        console.error(`  3. The Cloudinary URL is broken or private.`);
        console.error(`======================================\n`);
      });

  } catch (error) {
    next(error);
  }
};

import { semanticSearch } from '../utils/vectorSearch.js';

export const searchTest = async (req, res, next) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      const error = new Error('Question is required');
      error.statusCode = 400;
      return next(error);
    }

    // 1. Convert the user's question into an embedding using the exact same HuggingFace model
    const embeddings = await generateEmbeddings([question]);
    const queryEmbedding = embeddings[0];

    // 2. Perform semantic retrieval against MongoDB Atlas
    const matches = await semanticSearch(queryEmbedding, 5);

    // 3. Logging Requirements
    console.log(`\n======================================`);
    console.log(`✅ RETRIEVAL SUCCESS`);
    console.log(`Question:            "${question}"`);
    console.log(`Embedding Dimension: ${queryEmbedding.length}`);
    console.log(`Retrieved Chunks:    ${matches.length}`);
    console.log(`======================================\n`);

    // 4. Return top 5 matches
    res.status(200).json({ matches });
  } catch (error) {
    next(error);
  }
};

export const askBrochure = async (req, res, next) => {
  try {
    const { question, listingRef } = req.body;
    
    if (!question || !listingRef) {
      const error = new Error('Question and listingRef are required');
      error.statusCode = 400;
      return next(error);
    }

    if (!process.env.GROQ_API_KEY) {
      const error = new Error('GROQ_API_KEY is not configured on the server');
      error.statusCode = 500;
      return next(error);
    }

    // 1. Generate embedding for the question
    const embeddings = await generateEmbeddings([question]);
    const queryEmbedding = embeddings[0];

    // 2. Retrieve top 5 matching chunks from Atlas Vector Search for THIS specific listing
    const matches = await semanticSearch(queryEmbedding, listingRef, 5);

    // 3. Prepare the context by combining the text from the top matches
    const contextText = matches.map((match, i) => `[Chunk ${match.chunkIndex}]:\n${match.text}`).join('\n\n');

    // 4. Build the LangChain ChatPromptTemplate
    const systemTemplate = `You are an AI assistant for a real estate platform called Dwell Base. 
Your goal is to answer the user's question based ONLY on the provided brochure context.

RULES:
- Treat the brochure content as authoritative.
- Favor extraction over interpretation. Prefer extraction over speculation.
- If amenities, facilities, features, recreation areas, clubhouse facilities, outdoor areas, sports facilities, pools, gardens, parks, courts, lounges, etc. are present in the retrieved context, list them directly.
- Do NOT repeatedly say "not explicitly mentioned" if the item appears in the retrieved context.
- If an amenity appears in retrieved chunks, present it as an available feature.
- Do NOT explain confidence levels.
- Do NOT discuss whether something is implied.
- Answer using ONLY the retrieved brochure context below. Do NOT use outside knowledge.
- Only use exactly "The information is not available in the brochure." when the retrieved context genuinely lacks relevant information.
- Be concise and organize information clearly.
- Avoid huge paragraphs. Group related information.
- Use bullet points when listing amenities or features.
- Summarize long lists. Highlight the most important amenities first.
- Do NOT repeat information.
- Do NOT mention chunk numbers.
- Do NOT mention embeddings, retrieval, context, or AI internals.

FORMATTING EXAMPLES:
For amenity/facility questions:
Amenities available:
• Amenity 1
• Amenity 2
• Amenity 3
Additional recreation and community facilities are also available.

For feature questions:
Key Features:
• Feature 1
• Feature 2
• Feature 3

For yes/no questions:
Answer in one concise paragraph.

CONTEXT:
{context}`;

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", systemTemplate],
      ["human", "{question}"]
    ]);

    // 5. Setup LLM and LCEL Chain
    const llm = new ChatGroq({
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      maxTokens: 500,
      apiKey: process.env.GROQ_API_KEY,
    });

    const parser = new StringOutputParser();

    const chain = prompt.pipe(llm).pipe(parser);

    const answer = await chain.invoke({
      context: contextText,
      question: question
    });

    // 6. Map the sources to return with the answer
    const sources = matches.map(m => ({ chunkIndex: m.chunkIndex }));

    // 7. Logging Requirements
    console.log(`\n======================================`);
    console.log(`✅ GENERATION SUCCESS`);
    console.log(`Question:            "${question}"`);
    console.log(`Listing Reference:   ${listingRef}`);
    console.log(`Context Chunks Used: ${matches.length}`);
    console.log(`Answer Length:       ${answer.length} characters`);
    console.log(`======================================\n`);

    // 8. Return response
    res.status(200).json({ answer, sources });
  } catch (error) {
    next(error);
  }
};

export const checkBrochureExists = async (req, res, next) => {
  try {
    const brochure = await Brochure.findOne(
      { listingRef: req.params.listingId },
      { title: 1, originalFileName: 1 }
    );
    
    if (!brochure) {
      return res.status(200).json({
        hasBrochure: false,
        brochureTitle: null,
        originalFileName: null
      });
    }

    res.status(200).json({
      hasBrochure: true,
      brochureTitle: brochure.title,
      originalFileName: brochure.originalFileName
    });
  } catch (error) {
    next(error);
  }
};
